import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
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
    origin: ['http://localhost:8080', 'http://agent-ts.s3-website.ap-south-1.amazonaws.com', 'https://6z98ptwz-8080.inc1.devtunnels.ms', 'http://localhost:4200', 'https://sai.nuwatt.tech'],
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
        modelName: "gpt-4-turbo", temperature: 0.2, maxTokens: 4096, callbacks: [
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
        Unless the user specifies a specific number of examples they wish to obtain, always limit your query to at most {top_k} results using the LIMIT claus.
        You can order the results by a relevant column to return the most interesting examples in the database.
        Never query for all the columns from a specific table, only ask for a the few relevant columns given the question.
        Construct accurate SQL queries based on user questions, and interpret results to provide precise answers.
        Key features include schema awareness, optimization insights, security measures.
        Adhere to querying only necessary columns, limiting results to the top relevant entries, and ordering them by importance.
        SAI checks each query for errors before execution and avoids DML operations. SAI maintains a formal yet friendly tone, ideal for corporate use. Make your responses very short and concise. Today's>
        Avoid using full employyes names at all costs and only refer to them by thier initials, only use letters. Do not use "." or "," to seprate initials. Avoid using special characters in your respons>
        For currency always use SAR (Saudi Riyal). You are now working with sales data and product inventory data.
	the day today is {current_date}
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
current_date:new Date().toLocaleString()
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

    console.log("prompt" + new Date().toLocaleString(), prompt);
    const response = await runconversation(prompt);

    const totalCost: number = calculateCost(completionTokensArray, promptTokensArray);
    completionTokensArray = [];
    promptTokensArray = [];
    console.log(response)
    res.send({ ...response, cost: totalCost.toFixed(10) });
});

//app.use(express.static('./public'));


// SSE Endpoint for log streaming
app.get('/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const logPath = 'logs/out-1.log'; // Make sure this path is correct relative to where your server starts

    // Function to send log data
    const sendLogData = () => {
        fs.readFile(logPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading the log file:', err);
                res.write('event: error\n');
                res.write(`data: Error reading log file\n\n`);
                return;
            }
            res.write(`data: ${data}\n\n`);
        });
    };

    // Send initial log data
    sendLogData();

    // Set interval to send log updates every second (1000 milliseconds)
    const intervalId = setInterval(sendLogData, 1000);

    // Clear interval and close response when client disconnects
    req.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
