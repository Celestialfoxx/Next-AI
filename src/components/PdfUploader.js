import React from "react";
import axios from "axios"; // Import axios for HTTP requests
import { InboxOutlined } from "@ant-design/icons";
import { message, Upload } from "antd";

const { Dragger } = Upload;

const DOMAIN = "http://localhost:5001";

const uploadToBackend = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await axios.post(`${DOMAIN}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("Error uploading file: ", error);
    return null;
  }
};

const attributes = {
  //设置文件字段的名称， 便于后端接收文件
  name: "file",

  //允许上传多个文件
  multiple: true,

  //customRequest: 自定义文件上传的处理函数，这里调用uploadToBackend函数上传文件到服务器。
  //onSuccess和onError都是Dragger内部定义的
  /*
  onSuccess: 应该在文件成功上传到服务器且你已经接收到服务器的响应时调用。调用它会通知Upload组件上传成功，组件随后会更新其状态和UI，例如显示成功消息。

  onError: 应该在上传过程中遇到错误时调用。调用它会通知Upload组件上传失败，组件随后会更新其状态和UI，例如显示错误消息。

  onProgress: 可以在上传过程中多次调用，以更新上传进度。它通常用于显示文件上传的进度条。
  */
  customRequest: async ({ file, onSuccess, onError }) => {
    const response = await uploadToBackend(file);
    if (response && response.status === 200) {
      // Handle success
      onSuccess(response.data);
    } else {
      // Handle error
      onError(new Error("Upload failed"));
    }
  },

  //onChange: 当文件状态变化时触发的事件处理器，如上传中、完成或失败。
  onChange(info) {
    const { status } = info.file;
    if (status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (status === "done") {
      message.success(`${info.file.name} file uploaded successfully.`);
    } else if (status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  },

  //onDrop: 当文件被拖放到上传区域时触发的事件处理器。
  onDrop(e) {
    console.log("Dropped files", e.dataTransfer.files);
  },
};

const PdfUploader = () => {
  return (
    <Dragger {...attributes}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        Click or drag file to this area to upload
      </p>
      <p className="ant-upload-hint">
        Only support for a single or bulk upload.
      </p>
    </Dragger>
  );
};

export default PdfUploader;