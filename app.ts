import express from 'express';
import dotenv from 'dotenv';
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { createOpenAIToolsAgent, AgentExecutor } from "langchain/agents";
import { SqlToolkit } from "langchain/agents/toolkits/sql";
import { AIMessage } from "langchain/schema";
import { SqlDatabase } from "langchain/sql_db";
import { dataSource } from "./config";
import cors from 'cors';

const corsOption = {
    origin: ['http://localhost:8080'],
};
dotenv.config();

const app = express();

app.use(cors(corsOption));

const completionTokenRate: number = 0.0015; // $0.0015 per 1K completion tokens
const promptTokenRate: number = 0.0005; // $0.0005 per 1K prompt tokens

let completionTokensArray: number[] = [];
let promptTokensArray: number[] = [];
// Function to calculate cost
const calculateCost = (completionTokensArray: number[], promptTokensArray: number[]): number => {
    let totalCost: number = 0;

    // Iterate through arrays and calculate cost for each scenario
    for (let i: number = 0; i < completionTokensArray.length; i++) {
        const completionTokens: number = completionTokensArray[i];
        const promptTokens: number = promptTokensArray[i];

        // Calculate cost for current scenario
        const completionCost: number = (completionTokens / 1000) * completionTokenRate;
        const promptCost: number = (promptTokens / 1000) * promptTokenRate;

        // Add to total cost
        totalCost += completionCost + promptCost;
    }

    return totalCost;
}


const runconversation = async (input: string) => {
    const db = await SqlDatabase.fromDataSourceParams({
        appDataSource: dataSource,
    });

    const llm = new ChatOpenAI({
        modelName: "gpt-3.5-turbo-0125", temperature: 0, callbacks: [
            {
                handleLLMEnd(output) {
                    completionTokensArray.push(output.llmOutput?.tokenUsage.completionTokens)
                    promptTokensArray.push(output.llmOutput?.tokenUsage.promptTokens)
                }
            }
        ]
    });
    const sqlToolKit = new SqlToolkit(db, llm);
    const tools = sqlToolKit.getTools();

    const SQL_PREFIX = `You are an agent designed to interact with a SQL database.
Given an input question, create a syntactically correct {dialect} query to run, then look at the results of the query and return the answer.
Unless the user specifies a specific number of examples they wish to obtain, always limit your query to at most {top_k} results using the LIMIT clause.
You can order the results by a relevant column to return the most interesting examples in the database.
Never query for all the columns from a specific table, only ask for a the few relevant columns given the question.
You have access to tools for interacting with the database.
Only use the below tools.
Only use the information returned by the below tools to construct your final answer.
You MUST double check your query before executing it. If you get an error while executing a query, rewrite the query and try again.

DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
below is example of the data in the database
mat    |                   name                   | plant | sloc | year | mon |   batch    |  proddat   |   expdat   |  qty   
----------+------------------------------------------+-------+------+------+-----+------------+------------+------------+--------
50511518|SUNBULAH OKRA EXTRA (20X400G)            |1411   |FRAS  |2023  |11   |2886010823   |20230801   |20250131    |197
40474318|SUNBULAH SWEET CORN (12X400 G)|4580|EV23|2024|02|VG24010811|20240108|20250228|1
55309312|FORZA CHOCOLATE 24X120ML|4530|4537|2024|02|0022032023|20230322|20240321|3
55306412|CONE ZONE STRAWBERRY 12X500ML|1511|CKAS|2023|04|0026032023|20230326|20240325|10
55309412|FORZA STRAWBERRY 24X120ML|4580|JV47|2024|01|0018052023|20230518|20240517|2
55308812|FORZA VANILLA 12X500ML|4580|JV49|2024|01|0018052023|20230518|20240517|0.5
55601336|AHMADTEA LONDON BLEND TEA(12X100X2G)|1411|FJAS|2024|01|24112023|20231124|20261124|100
51701412|Sunbulah Whole Wheat Rusk (6 x 300g)|4580|RV36|2024|02|2122023|20231202|20241201|5
51701312|Sunbulah Rusk Regular (12 x 50g)|1201|WCAS|2023|10|2082023|20230802|20240801|1
51701212|Sunbulah Regular Rusk (6 x 300g)|4580|JV55|2024|02|2112023|20231102|20241101|0.5
51701512|Sunbulah Whole Wheat Rusk (12 x 50g)|4500|4511|2024|02|2122023|20231202|20241201|1 

If the question does not seem related to the database at all, just return "I don't know" as the answer.`;
    const SQL_SUFFIX = `Begin!

Question: {input}
Thought: I should look at the tables in the database to see what I can query.
{agent_scratchpad}`;
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", SQL_PREFIX],
        HumanMessagePromptTemplate.fromTemplate("{input}"),
        new AIMessage(SQL_SUFFIX.replace("{agent_scratchpad}", "")),
        new MessagesPlaceholder("agent_scratchpad"),
    ]);
    const newPrompt = await prompt.partial({
        dialect: sqlToolKit.dialect,
        top_k: "10",
    });
    const runnableAgent = await createOpenAIToolsAgent({
        llm,
        tools,
        prompt: newPrompt,
    });
    const agentExecutor = new AgentExecutor({
        agent: runnableAgent,
        tools,
    });
    return await agentExecutor.invoke({
        input: input,
    })
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.post('/chat', async (req, res) => {
    const { prompt } = req.body;
    console.log("prompt", prompt);
    const response = await runconversation(prompt);

    const totalCost: number = calculateCost(completionTokensArray, promptTokensArray);
    completionTokensArray = [];
    promptTokensArray = [];
    res.send({ ...response, cost: totalCost.toFixed(10) });
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});