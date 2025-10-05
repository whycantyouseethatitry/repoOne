import { atom } from 'recoil';

export const topicAtom = atom({
  key: 'topicAtom',
  default: '',
});

export const quizAtom = atom({
  key: 'quizAtom',
  default: {
    topic: '',
    questions: [],
    meta: { difficulty: 'easy' },
    status: 'idle', // idle | loading | ready | error
    error: null,
  },
});

export const currentQuestionIndexAtom = atom({
  key: 'currentQuestionIndexAtom',
  default: 0,
});

export const answersAtom = atom({
  key: 'answersAtom',
  default: {}, // { [questionId]: selectedIndex }
});
