// express：一个Node.js的Web应用框架，用于构建Web服务器和API。
import express from "express";
// cors：一个中间件，用于启用跨域资源共享，允许不同域名的客户端访问服务器。
import cors from "cors";
// dotenv：用于从.env文件加载环境变量到process.env。
import dotenv from "dotenv";
// multer：用于处理multipart/form-data类型的表单数据，主要用于上传文件。
import multer from "multer"; // Import multer
import chat from "./chat.js";


dotenv.config();

//直接用express创建后端
const app = express();
//启用跨域领域资源共享
app.use(cors()); //use(middleware)

// Configure multer
//用multer的diskStorage来制定一个存储的规则， 上传的文件存在uploads目录下， 并且保留原有文件名
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

//生成一个multer实例， 用以上规则来存储文件
const upload = multer({ storage: storage });

const PORT = 5001;

let filePath;

//设定一个restful url， multer的实例接收一个single的文件
app.post("/upload", upload.single("file"), async (req, res) => {
  // Use multer to handle file upload

  //从request中获得file的路径
  filePath = req.file.path; // The path where the file is temporarily saved
  //response中回复文件已上传
  res.send(filePath + " upload successfully.");
});

//调用chat.js， 得到回答， 并传给response
app.get("/chat", async (req, res) => {
  const resp = await chat(filePath, req.query.question); // Pass the file path to your main function
  res.send(resp.text);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
