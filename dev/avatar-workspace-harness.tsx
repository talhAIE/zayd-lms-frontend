// Local fixture entry only. Never imported by the production entry/build.
import { createRoot } from 'react-dom/client';
import cues from '../src/components/avatar-reading/readingNarrationCues.json';
import '../src/index.css';
if (!import.meta.env.DEV || !['localhost', '127.0.0.1'].includes(location.hostname)) throw Error('Local only');
const query = new URLSearchParams(location.search);
const mode = query.get('mode') === 'listening' ? 'listening' : query.get('mode') === 'roleplay' ? 'roleplay' : 'reading';
const id = query.get('topic') === 'second' ? '257b6f1d-8623-483c-a5cc-2c50a04c125f' : 'e6d4bc7d-6be1-4f01-9d45-1b94f90e0827';
const source = cues[id];
const title = mode === 'reading' ? id.startsWith('e6d') ? 'The True Story of a Boy and His Horn' : 'Someone Has to Do It!' : `Local ${mode} fixture`;
const practice = mode === 'reading' && query.get('stage') === 'practice';
const video = 'https://aitutorappstorage.blob.core.windows.net/aitutorblob/3d-listening-mode/saudia/3D%20avatar-listeningSAUDI.mp4';
localStorage.setItem('AiTutorUser', JSON.stringify({id:'00000000-0000-4000-8000-000000000001',username:'fixture',firstName:'Local',lastName:'Fixture',role:'student',region:'ROW'}));
localStorage.setItem('accessToken','local-fixture'); localStorage.setItem('refreshToken','local-fixture');
history.replaceState({}, '', `/student/3d-avatar/${mode}/${id}`);
const {default:client} = await import('../src/config/ApiConfig');
client.defaults.adapter = async config => {
  const url=config.url??'';
  let data;
  if(url.endsWith('/availability')) data={available:true};
  else if(url.endsWith('/topics')) data={topics:[{id,title,imageUrl:null,questionCount:0,completed:false}]};
  else if(url.endsWith('/actions')) {
    const history=mode==='roleplay'?(query.get('stage')==='scenario'?[]:Array.from({length:18},(_,i)=>({id:`message-${i}`,sender:i%2?'user':'ai',role:i%2?'user':'assistant',content:`Conversation turn ${i+1}. ${source.text.slice(0,180)}`,audioUrl:source.audioUrl,createdAt:new Date().toISOString()}))):
      practice ? [0,1].map(i=>({id:`practice-${i}`,sender:i?'user':'ai',role:i?'user':'assistant',content:i?'My recorded attempt.':`Please read the following sentence aloud:\n\n“${source.text.slice(0,source.text.indexOf('.')+1)}”\n`,readingSpeechText:source.text.slice(0,source.text.indexOf('.')+1),audioUrl:source.audioUrl,createdAt:new Date().toISOString()})) : [];
    const session={modeSessionId:id,lessonModeId:id,modeKey:`${mode}-mode`,isCompleted:false,chatHistory:history,
      roleplayProgress:{completedTurns:0,requiredTurns:7,remainingTurns:7},
      readingProgress:{phase:'reading',hasListenedToPassage:practice,isRetrying:practice,currentSentenceIndex:0,totalSentences:13,attemptedSentenceIndexes:[],acceptedSentenceIndexes:[],percentComplete:0},
      contentPayload:{content:source.text,contentAudioUrl:source.audioUrl,narrationVideoUrl:video,readingPresentation:{format:'paragraph',title}}};
    const events=[{event:'mode_session_started',payload:session}];
    if(mode==='listening') events.push({event:'listening_payload',payload:{modeSessionId:id,stage:'initial',kbAudioUrl:source.audioUrl,narrationAudioUrl:source.audioUrl,narrationText:'Listen carefully to the audio. You will listen twice before answering the quiz.',narrationVideoUrl:video}} as typeof events[number]);
    data={events};
  } else throw Error(`Fixture blocked ${url}`);
  return {data,status:200,statusText:'OK',headers:{},config};
};
const {default:App}=await import('../src/App');
createRoot(document.getElementById('root')!).render(<App/>);
