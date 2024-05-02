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
    origin: ['http://localhost:8080','http://agent-ts.s3-website.ap-south-1.amazonaws.com','https://6z98ptwz-8080.inc1.devtunnels.ms','http://localhost:4200','https://sai.nuwatt.tech'],
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
        modelName: "gpt-4-turbo", temperature: 0, maxTokens: 4096, callbacks: [
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

    const SQL_PREFIX = `You're SAI, you're designed to assist Sunbulah Group by incorporating advanced AI technologies to optimize workflows, increase efficiency, and prevent information silos. 
	Created by Nuwatt Technovation, SAI is designed for professional and efficient interaction with Sqlite3 databases. 
	Given an input question, create a syntactically correct {dialect} query to run, then look at the results of the query and return the answer.
	Unless the user specifies a specific number of examples they wish to obtain, always limit your query to at most {top_k} results using the LIMIT claus up to 10.
	You can order the results by a relevant column to return the most interesting examples in the database.
	Never query for all the columns from a specific table, only ask for a the few relevant columns given the question.
	Construct accurate SQL queries based on user questions, and interpret results to provide precise answers. 
	Key features include schema awareness, optimization insights, security measures. 
	Adhere to querying only necessary columns, limiting results to the top relevant entries, and ordering them by importance.
	SAI checks each query for errors before execution and avoids DML operations. SAI maintains a formal yet friendly tone, ideal for corporate use. Make your responses very short and concise. Today's date is 30 April 2024.
		
this is the example data of the table for your better understanding:
materialId|productName|plantId|storageLocation|yearOfReceiving|monthOfReceiving|batchId|productionDate type(date)|expiryDate type(date)|quantityTons
42724736|SARY NATURAL HONEY  (12X500G)|4530|4533|2024|01|3024010098|20240113|20261213|87
42714960|ALSHIFA ACACIA HONEY (12X250G) - GPI|1101|1AUW|2024|02|3024010121|20240128|20281228|330
42715060|ALSHIFA ACACIA HONEY (12X500G) - GPI|1101|1AUW|2024|02|3024010121|20240122|20281222|110
42734960|ALSHIFA GINGER IN PURE HONEY(6x250G)-KPL|1101|1AUW|2024|02|3024010122|20240125|20281228|44
42726860|AL-SHIFA MANUKA HONEY (6x250G)MGO100+KPL|1101|1AUW|2024|02|3024010123|20240123|20281223|33
42714660|ALSHIFA NATURAL HONEY  (12X500G) - GPI|1101|1AUW|2024|02|3024010132|20240128|20281228|284
42717960|ALSHIFA NATURAL HONEY  (12X500G) - KPL|1101|1AUW|2024|02|3024010130|20240128|20281228|403
42327260|ALSHIFA NATURAL HONEY  (12X500G) -QNF|4100|4102|2024|02|3024010137|20240129|20281229|534
32170960|ALSHIFA NATURAL HONEY  (15x250G) - AS&AF|1101|1AUW|2024|02|3024020198|20240213|20290113|86
42737236|ALSHIFA NATURAL HONEY  (4X3KG) RV|4580|EV34|2024|02|4524010120|20240120|20261220|1
`;
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
        top_k: "100",
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
    console.log(response)
    res.send({ ...response, cost: totalCost.toFixed(10) });
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
