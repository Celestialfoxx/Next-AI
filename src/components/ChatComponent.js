import React, { useState, useEffect } from "react"; // Import useState
//axios就是用来call后端api的一个包，会比直接用fetch来call要性能更好（axios包内有更多的优化处理）
import axios from "axios";
import { Button, Input } from "antd";
import { AudioOutlined } from "@ant-design/icons";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Speech from "speak-tts";

const { Search } = Input;

const DOMAIN = "http://localhost:5001";

const searchContainer = {
  display: "flex",
  justifyContent: "center",
};

const ChatComponent = (props) => {
  const { handleResp, isLoading, setIsLoading } = props;
  // Define a state variable to keep track of the search value
  const [searchValue, setSearchValue] = useState("");
  const [isChatModeOn, setIsChatModeOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  //speach是speak-tts包下的一个object，用来生成机械化的语音
  const [speech, setSpeech] = useState();

  // speech recognation
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  useEffect(() => {
    const speech = new Speech();
    // 设定speech的参数
    speech
      .init({
        volume: 1,
        lang: "en-US",
        rate: 1,
        pitch: 1,
        voice: "Google US English",
        splitSentences: true,
      })
      .then((data) => {
        // The "data" object contains the list of available voices and the voice synthesis params
        console.log("Speech is ready, voices are available", data);
        setSpeech(speech);
      })
      .catch((e) => {
        console.error("An error occured while initializing : ", e);
      });
  }, []); //仅在首次渲染时执行一次

  useEffect(() => {
    //如果并不在listening但是transcript（输入）并不为空时， 关掉recording
    // !!transcript第一个感叹号变为boolean， 但默认为false， 第二个感叹号再取反，表示不为空
    if (!listening && !!transcript) {
      (async () => await onSearch(transcript))();
      setIsRecording(false);
    }
  }, [listening, transcript]); //在listening或transcript改变的时候执行

  const talk = (what2say) => {
    speech
      .speak({
        text: what2say,
        queue: false, // current speech will be interrupted, 如果有新的朗读请求，不应该排在queue中， 而是直接从新的开始读
        /*
          listeners: 一个包含不同回调函数的对象，用于处理朗读过程中的各种事件：

          onstart: 朗读开始时触发的函数，这里简单地在控制台打印"Start utterance"。
          onend: 朗读结束时触发的函数，打印"End utterance"。
          onresume: 朗读恢复时触发的函数，打印"Resume utterance"。
          onboundary: 在达到文本的某个边界（如词或句子）时触发，打印出边界名称和达到该边界所花费的时间。
        */
        listeners: {
          onstart: () => {
            console.log("Start utterance");
          },
          onend: () => {
            console.log("End utterance");
          },
          onresume: () => {
            console.log("Resume utterance");
          },
          onboundary: (event) => {
            console.log(
              event.name +
                " boundary reached after " +
                event.elapsedTime +
                " milliseconds."
            );
          },
        },
      })
      .then(() => {
        // if everyting went well, start listening again
        console.log("Success !");
        userStartConvo();
      })
      .catch((e) => {
        console.error("An error occurred :", e);
      });
  };

  //用户开始录音会话，reset之前的transcript，开始录音
  const userStartConvo = () => {
    SpeechRecognition.startListening();
    setIsRecording(true);
    resetEverything();
  };

  //speech自带的api， 删除之前已经翻译得到的transcript
  const resetEverything = () => {
    resetTranscript();
  };

  //打开chatmode， 并开始录音
  const chatModeClickHandler = () => {
    setIsChatModeOn(!isChatModeOn);
    setIsRecording(false);
    SpeechRecognition.stopListening();
  };

  //chatmode下的录音按钮
  const recordingClickHandler = () => {
    if (isRecording) {
      setIsRecording(false);
      SpeechRecognition.stopListening();
    } else {
      setIsRecording(true);
      SpeechRecognition.startListening();
    }
  };

  //对question开始search，准备response data
  const onSearch = async (question) => {
    // Clear the search input
    //重置search value的输入
    setSearchValue("");

    //开启loading界面
    setIsLoading(true);

    try {
      //调用后端chat， 传递question
      const response = await axios.get(`${DOMAIN}/chat`, {
        params: {
          question,
        },
      });

      //调用props中的handleResp，把response的内容渲染到页面上
      handleResp(question, response.data);

      //如果chat mode是打开的， 则语音读出来
      if (isChatModeOn) {
        talk(response.data);
      }
    } catch (error) {
      console.error(`Error: ${error}`);
      handleResp(question, error);
    } finally {
      //最后关闭loading界面
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    // Update searchValue state when the user types in the input box
    setSearchValue(e.target.value);
  };

  return (
    <div style={searchContainer}>
      {!isChatModeOn && (
        <Search
          placeholder="input search text"
          enterButton="Ask"
          size="large"
          onSearch={onSearch}
          loading={isLoading}
          value={searchValue} // Control the value
          onChange={handleChange} // Update the value when changed
        />
      )}
      <Button
        type="primary"
        size="large"
        danger={isChatModeOn}
        onClick={chatModeClickHandler}
        style={{ marginLeft: "5px" }}
      >
        Chat Mode: {isChatModeOn ? "On" : "Off"}
      </Button>
      {isChatModeOn && (
        <Button
          type="primary"
          icon={<AudioOutlined />}
          size="large"
          danger={isRecording}
          onClick={recordingClickHandler}
          style={{ marginLeft: "5px" }}
        >
          {isRecording ? "Recording..." : "Click to record"}
        </Button>
      )}
    </div>
  );
};

export default ChatComponent;
