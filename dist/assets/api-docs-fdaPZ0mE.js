import{d as b,r as u,c,a as t,w as o,o as _,b as s,n as l}from"./index-DAZDpghP.js";import{E as f}from"./card-_e8Y2itV.js";import{E as g,a as E}from"./tab-pane-CYGs3JAp.js";import{a as x,E as h}from"./table-column-CkszfM6q.js";import"./checkbox-DDntw5na.js";import"./scrollbar-BKn1N4ug.js";/* empty css            */import{E as y}from"./alert-C4LvZx9F.js";import{_ as A}from"./_plugin-vue_export-helper-DlAUqK2U.js";import"./strings-BN0-5NCg.js";import"./event-D5_Wo8Xc.js";import"./index-BtSJ9mPq.js";import"./_baseClone-BBryStzM.js";import"./isPlainObject-CnEW4LJ3.js";import"./_baseIteratee-DgY2c_zD.js";import"./isEqual-DlB8YXyV.js";import"./debounce-Bv_84CHO.js";import"./index-17xiCnpu.js";const P={class:"api-docs-page"},q=`import requests

url = "https://api.example.com/v1/chat/completions"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "model": "llama-2-7b",
    "messages": [
        {"role": "system", "content": "你是一个有帮助的AI助手"},
        {"role": "user", "content": "介绍一下Python语言"}
    ],
    "temperature": 0.7,
    "max_tokens": 2000
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,T=`import requests

url = "https://api.example.com/v1/embeddings"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "model": "bge-large",
    "input": "这是一段需要向量化的文本"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,I=`import requests

url = "https://api.example.com/v1/images/generations"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "model": "stable-diffusion-xl",
    "prompt": "一只可爱的猫咪",
    "size": "1024x1024",
    "n": 1
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,k=b({__name:"api-docs",setup(v){const p=u([{param:"model",type:"string",required:"是",desc:"模型名称"},{param:"messages",type:"array",required:"是",desc:"对话消息列表"},{param:"temperature",type:"number",required:"否",desc:"温度参数，默认0.7"},{param:"max_tokens",type:"integer",required:"否",desc:"最大生成token数"},{param:"top_p",type:"number",required:"否",desc:"Top-p采样参数"}]);return(j,e)=>{const n=y,a=E,r=h,m=x,d=g,i=f;return _(),c("div",P,[t(i,null,{default:o(()=>[e[12]||(e[12]=s("h2",{class:"text-2xl font-bold mb-4"}," API文档 ",-1)),t(n,{type:"info",closable:!1,class:"mb-4"},{default:o(()=>e[0]||(e[0]=[s("p",null,"本页面提供模型服务API的详细使用文档和示例代码",-1)])),_:1,__:[0]}),t(d,null,{default:o(()=>[t(a,{label:"快速开始",name:"quickstart"},{default:o(()=>e[1]||(e[1]=[s("h3",{class:"font-bold mb-3"},"获取API Key",-1),s("p",{class:"mb-3"},"在调用API之前，请先在用户中心获取您的API Key",-1),s("h3",{class:"font-bold mb-3 mt-4"},"认证方式",-1),s("p",{class:"mb-2"},"在HTTP请求头中添加Authorization字段：",-1),s("pre",{class:"code-block"},"Authorization: Bearer YOUR_API_KEY",-1),s("h3",{class:"font-bold mb-3 mt-4"},"基础URL",-1),s("pre",{class:"code-block"},"https://api.example.com/v1",-1)])),_:1,__:[1]}),t(a,{label:"Chat Completions",name:"chat"},{default:o(()=>[e[2]||(e[2]=s("h3",{class:"font-bold mb-3"},"创建对话补全",-1)),e[3]||(e[3]=s("p",{class:"mb-3"},"POST /v1/chat/completions",-1)),e[4]||(e[4]=s("h4",{class:"font-bold mb-2"},"请求参数",-1)),t(m,{data:p.value,border:"",class:"mb-4"},{default:o(()=>[t(r,{prop:"param",label:"参数",width:"150"}),t(r,{prop:"type",label:"类型",width:"100"}),t(r,{prop:"required",label:"必填",width:"80"}),t(r,{prop:"desc",label:"说明"})]),_:1},8,["data"]),e[5]||(e[5]=s("h4",{class:"font-bold mb-2"},"示例代码",-1)),s("pre",{class:"code-block"},l(q))]),_:1,__:[2,3,4,5]}),t(a,{label:"Embeddings",name:"embeddings"},{default:o(()=>[e[6]||(e[6]=s("h3",{class:"font-bold mb-3"},"创建文本嵌入",-1)),e[7]||(e[7]=s("p",{class:"mb-3"},"POST /v1/embeddings",-1)),e[8]||(e[8]=s("h4",{class:"font-bold mb-2"},"示例代码",-1)),s("pre",{class:"code-block"},l(T))]),_:1,__:[6,7,8]}),t(a,{label:"Image Generation",name:"images"},{default:o(()=>[e[9]||(e[9]=s("h3",{class:"font-bold mb-3"},"图像生成",-1)),e[10]||(e[10]=s("p",{class:"mb-3"},"POST /v1/images/generations",-1)),e[11]||(e[11]=s("h4",{class:"font-bold mb-2"},"示例代码",-1)),s("pre",{class:"code-block"},l(I))]),_:1,__:[9,10,11]})]),_:1})]),_:1,__:[12]})])}}}),M=A(k,[["__scopeId","data-v-24d37c6a"]]);export{M as default};
