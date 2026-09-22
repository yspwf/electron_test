import React, { useEffect, useState } from 'react';

const CommunicationPanel: React.FC = () => {
  const [callbackResult, setCallbackResult] = useState<string>(
    '结果: 异步-回调 - 2023-12-05 19:18:33'
  );
  const [asyncResult, setAsyncResult] = useState<string>('结果:');
  const [syncResult, setSyncResult] = useState<string>('结果:');
  const [longResult, setLongResult] = useState<string>('结果:');
  const [isListening, setIsListening] = useState<boolean>(false);

  const handleSendCallback = () => {
    const now = new Date().toLocaleString('zh-CN').replace(/\//g, '-');
    setCallbackResult(`结果: 异步-回调 - ${now}`);
  };

  const handleSendAsync = async () => {
    setAsyncResult('结果: 请求中...');
    await new Promise((r) => setTimeout(r, 500));
    setAsyncResult('结果: 异步-await - 已完成');
  };

  const handleSendSync = () => setSyncResult('结果: 同步消息已发送');
  const handleStartLong = () => {
    setIsListening(true);
    setLongResult('结果: 监听中...');
  };
  const handleEndLong = () => {
    setIsListening(false);
    setLongResult('结果: 已停止');
  };

  useEffect(() => {
    if (!isListening) return;
    const t = window.setInterval(() => {
      setLongResult(`推送消息 - ${new Date().toLocaleTimeString('zh-CN')}`);
    }, 2000);
    return () => window.clearInterval(t);
  }, [isListening]);

  return (
    <main className="content-panel">
      <section className="block">
        <h3>1. 发送异步消息</h3>
        <div className="row">
          <button onClick={handleSendCallback}>发送 - 回调</button>
          <span className="result">{callbackResult}</span>
        </div>
        <div className="row">
          <button onClick={handleSendAsync}>发送 - async/await</button>
          <span className="result">{asyncResult}</span>
        </div>
      </section>

      <section className="block">
        <h3>2. 同步消息（不推荐，阻塞执行）</h3>
        <div className="row">
          <button onClick={handleSendSync}>同步消息</button>
          <span className="result">{syncResult}</span>
        </div>
      </section>

      <section className="block">
        <h3>3. 长消息：服务端持续向前端页面发消息</h3>
        <div className="row">
          <button onClick={handleStartLong}>开始</button>
          <button onClick={handleEndLong}>结束</button>
          <span className="result">{longResult}</span>
        </div>
      </section>

      <section className="block">
        <h3>4. 多窗口通信：子窗口与主进程通信，子窗口互相通信</h3>
        <div className="row">
          <button>打开新窗口2</button>
          <button>向新窗口2发消息</button>
        </div>
      </section>
    </main>
  );
};

export default CommunicationPanel;