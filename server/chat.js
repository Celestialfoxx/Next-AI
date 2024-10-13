import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";

import { PDFLoader } from "langchain/document_loaders/fs/pdf";

// NOTE: change this default filePath to any of your default file name
//此处的filepath是在没有上传文件时候的默认file
const chat = async (filePath = "./uploads/CV.pdf", query) => {
  // step 1:
  //读取pdf
  const loader = new PDFLoader(filePath);
  //存入data
  const data = await loader.load();

  // step 2:
  //将pdf的文字切割成token
  //chunksize代表每段切割的token上限
  //overlap代表该段与上一段的连接，联系上下文来防止语意丢失
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 0,
  });

  const splitDocs = await textSplitter.splitDocuments(data);

  // step 3
  //把文字变成vector
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings
  );

  // step 4: retrieval
  //测试
  // const relevantDocs = await vectorStore.similaritySearch(
  // "What is task decomposition?"
  // );

  // step 5: qa w/ customzie the prompt
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
  });

  const template = `Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Use three sentences maximum and keep the answer as concise as possible.

{context}
Question: {question}
Helpful Answer:`;

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
    prompt: PromptTemplate.fromTemplate(template),
    // returnSourceDocuments: true,
  });

  const response = await chain.call({
    query,
  });

  return response;
};

export default chat;
