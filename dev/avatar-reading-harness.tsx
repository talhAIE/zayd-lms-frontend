// Development-only UI fixtures. No backend, production mutations or AI calls.
import { createRoot } from 'react-dom/client';
import type { InternalAxiosRequestConfig } from 'axios';
import '../src/index.css';

if (!import.meta.env.DEV || !['localhost', '127.0.0.1'].includes(location.hostname)) throw new Error('Local development only');
const query = new URLSearchParams(location.search);
const requestedRoute = query.get('route') || '/student/courses';
const route = requestedRoute.startsWith('/student/3d-avatar') || requestedRoute === '/student/courses' ? requestedRoute : '/student/courses';
const user = { id: '00000000-0000-4000-8000-000000000001', username: 'avatar.fixture', firstName: 'Test', lastName: 'Learner', role: 'student', region: 'ROW' };
localStorage.setItem('AiTutorUser', JSON.stringify(user));
localStorage.setItem('accessToken', 'local-fixture-not-a-real-token');
localStorage.setItem('refreshToken', 'local-fixture-not-a-real-token');
history.replaceState({}, '', route);
const topics = [
  { id: 'e6d4bc7d-6be1-4f01-9d45-1b94f90e0827', title: 'The True Story of a Boy and His Horn', imageUrl: 'https://aitutorappstorage.blob.core.windows.net/aitutorblob/reading_mode_images/american-2ndterm-week-1/Reading%205-1.jpg',
    audio: 'https://aitutorappstorage.blob.core.windows.net/aitutorblob/topic-audio/1df0d91c-06a0-438a-8270-5c56ada0a290.wav',
    video: 'https://aitutorappstorage.blob.core.windows.net/aitutorblob/3d-reading-mode/american/2nd%20Term_%20Grade%205,%20Week%201%20The%20True%20Story%20of%20a%20Boy%20and%20His%20Horn.mp4' },
  { id: '257b6f1d-8623-483c-a5cc-2c50a04c125f', title: 'Someone Has to Do It!', imageUrl: 'https://zayd-ai-bucket.oss-me-central-1.aliyuncs.com/reading_mode_topics/Unit%201/Grade%208/Reading%208-9.jpg',
    audio: 'https://aitutorappstorage.blob.core.windows.net/aitutorblob/topic-audio/05b03af9-7909-4003-8179-fb4ccd0020cc.wav',
    video: 'https://aitutorappstorage.blob.core.windows.net/aitutorblob/3d-reading-mode/saudia/2nd%20Semester%20Unit%201,%20Grade%208%20Someone%20Has%20to%20Do%20It!.mp4' },
];
const questions = [{ id: '00000000-0000-4000-8000-000000000003', question: 'Which activity is this?', options: ['Reading', 'Cooking', 'Driving', 'Swimming'] }];
let selected = topics[0];
const phases = new Map(topics.map(t => [t.id, sessionStorage.getItem(`avatar-fixture:${t.id}`) ||
  (query.get('stage') === 'quiz' && requestedRoute.endsWith(t.id) ? 'quiz' : 'reading')]));
let phase = phases.get(selected.id) || 'reading';
const progress = () => ({ phase, hasListenedToPassage: phase !== 'reading', currentSentenceIndex: 0, totalSentences: 2, attemptedSentenceIndexes: [], acceptedSentenceIndexes: [], isRetrying: false, rejectedAttemptCount: 0, percentComplete: phase === 'reading' ? 0 : 100 });
const session = () => ({ lessonModeId: selected.id, modeSessionId: selected.id, modeKey: 'reading-mode', isCompleted: phase === 'completed', readingProgress: progress(),
  contentPayload: { title: selected.title, content: 'This is a local UI verification passage. Read each sentence aloud.', contentAudioUrl: selected.audio, narrationVideoUrl: selected.video,
    readingPresentation: { format: 'paragraph', title: selected.title } }, chatHistory: [], ...(phase === 'quiz' ? { mcqs: questions } : {}) });
const { default: client } = await import('../src/config/ApiConfig');
client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
  let data: unknown;
  const url = config.url || '';
  if (url.endsWith('/3d-avatar/availability')) data = { available: query.get('disabled') !== 'true' };
  else if (url.endsWith('/3d-avatar/reading/topics')) data = { topics: topics.map(t => ({ id: t.id, title: t.title, imageUrl: t.imageUrl, questionCount: t === topics[0] ? 8 : 6, completed: sessionStorage.getItem(`avatar-fixture:${t.id}`) === 'completed' })) };
  else if (url.endsWith('/3d-avatar/reading/actions')) {
    const body = JSON.parse(config.data);
    let events: Array<{ event: string; payload: unknown }> = [];
    if (body.action === 'start_mode_session' || body.action === 'restart_mode_session') {
      selected = topics.find(t => t.id === body.lessonModeId) || topics[0];
      phase = body.action === 'restart_mode_session' ? 'reading' : phases.get(selected.id) || 'reading';
      phases.set(selected.id, phase);
      events = [{ event: 'mode_session_started', payload: session() }];
    } else if (body.action === 'reading_passage_listened') events = [{ event: 'reading_progress', payload: { ...progress(), hasListenedToPassage: true } }];
    else if (body.action === 'check_mcq_answer') events = [{ event: 'mcq_answer_result', payload: { questionId: questions[0].id, isCorrect: body.answer === 0, message: body.answer === 0 ? 'Correct! Great job.' : 'Not quite. Try another answer.' } }];
    else if (body.action === 'submit_mcqs') {
      phase = 'completed'; phases.set(selected.id, phase); sessionStorage.setItem(`avatar-fixture:${selected.id}`, 'completed');
      events = [{ event: 'reading_progress', payload: progress() }, { event: 'mcq_result', payload: { passed: true, correctCount: 1, required: 1, message: 'Quiz passed!' } }, { event: 'chat_completed', payload: {} }];
    }
    data = { events };
  } else if (url.includes('/learning/courses')) data = { status: true, data: { courses: [] } };
  else if (url.includes('/science-spark') || url.includes('/spark-science')) data = { available: false, status: true, data: { available: false, course: null } };
  else throw new Error(`UI fixture blocked unexpected request: ${url}`);
  return { data, status: 200, statusText: 'OK', headers: {}, config };
};
const { default: App } = await import('../src/App');
createRoot(document.getElementById('root')!).render(<App />);
