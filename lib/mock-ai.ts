import { lessonById, lessons } from "@/lib/lessons";
import {
  type DifficultyResult,
  type PracticeRequest,
  type ReviewResult,
  type ScoreResult,
  type VocabResult,
} from "@/lib/schemas";
import { cefrRank, contentWords, scoreSummary, weakestSubscore } from "@/lib/score";
import { splitSentences } from "@/lib/transcript";

const vocabByLesson: Record<string, VocabResult["items"]> = {
  "on-the-ball": [
    {
      phrase: "on the ball",
      explanationEn: "Quick, alert, and effective at your work.",
      explanationVi: "Làm việc nhanh, tỉnh táo và hiệu quả.",
      example: "You are really on the ball today.",
    },
    {
      phrase: "productive",
      explanationEn: "Able to get a lot of useful work done.",
      explanationVi: "Làm được nhiều việc có ích.",
      example: "It was a very productive morning.",
    },
    {
      phrase: "report",
      explanationEn: "A written account of work you finished.",
      explanationVi: "Bản báo cáo về việc bạn đã làm.",
      example: "I finished three reports before lunch.",
    },
    {
      phrase: "ahead of time",
      explanationEn: "Earlier than the expected time.",
      explanationVi: "Sớm hơn thời gian dự kiến.",
      example: "She finished the task ahead of time.",
    },
    {
      phrase: "get on the ball",
      explanationEn: "Start working better or faster.",
      explanationVi: "Bắt đầu làm việc nhanh và nghiêm túc hơn.",
      example: "We need to get on the ball before Friday.",
    },
    {
      phrase: "lots of",
      explanationEn: "A large amount of something.",
      explanationVi: "Rất nhiều.",
      example: "She drinks lots of coffee when she is busy.",
    },
    {
      phrase: "so fast",
      explanationEn: "At a surprisingly high speed.",
      explanationVi: "Nhanh đến mức đáng ngạc nhiên.",
      example: "How did you finish so fast?",
    },
    {
      phrase: "not that much",
      explanationEn: "A smaller amount than what was offered.",
      explanationVi: "Không nhiều đến mức vừa được đề nghị.",
      example: "I'll have some coffee, but not that much.",
    },
  ],
  "hold-your-horses": [
    {
      phrase: "hold your horses",
      explanationEn: "An informal way to tell someone to wait and calm down.",
      explanationVi: "Cách nói thân mật để bảo ai đó khoan đã, bình tĩnh.",
      example: "Hold your horses! We should check the address first.",
    },
    {
      phrase: "just a second",
      explanationEn: "A polite way to ask for a very short wait.",
      explanationVi: "Cách lịch sự để xin chờ một lát.",
      example: "Just a second. I'm almost done with this page.",
    },
    {
      phrase: "patient",
      explanationEn: "Able to wait without getting angry.",
      explanationVi: "Có thể chờ mà không nóng ruột.",
      example: "Please be patient while I finish this box.",
    },
    {
      phrase: "informal",
      explanationEn: "Suitable for friends, not for a formal situation.",
      explanationVi: "Dùng với bạn bè, không hợp lúc trang trọng.",
      example: "This idiom is very informal.",
    },
    {
      phrase: "rude",
      explanationEn: "Not polite, and possibly hurtful.",
      explanationVi: "Thiếu lịch sự, có thể làm người khác khó chịu.",
      example: "Depending on your tone, it could sound rude.",
    },
    {
      phrase: "heavy",
      explanationEn: "Difficult to lift because of its weight.",
      explanationVi: "Nặng, khó nhấc lên.",
      example: "This box is really heavy.",
    },
    {
      phrase: "idiom",
      explanationEn: "A phrase whose meaning is not the meaning of each word.",
      explanationVi: "Cụm từ có nghĩa không theo từng chữ.",
      example: "Hold your horses is an idiom about waiting.",
    },
    {
      phrase: "skill",
      explanationEn: "The ability to do something well.",
      explanationVi: "Kỹ năng để làm một việc cho tốt.",
      example: "Riding a horse takes skill and strength.",
    },
  ],
  "catch-some-zs": [
    {
      phrase: "catch some Z's",
      explanationEn: "An informal way to say you want to sleep or nap.",
      explanationVi: "Cách nói thân mật: ngủ hoặc chợp mắt một lúc.",
      example: "I need to catch some Z's before the meeting.",
    },
    {
      phrase: "go to bed",
      explanationEn: "To get into bed in order to sleep.",
      explanationVi: "Đi ngủ.",
      example: "What time did you go to bed last night?",
    },
    {
      phrase: "snore",
      explanationEn: "To breathe noisily while you are asleep.",
      explanationVi: "Ngáy khi đang ngủ.",
      example: "Some people snore when they sleep.",
    },
    {
      phrase: "recording studio",
      explanationEn: "A quiet room used for recording sound.",
      explanationVi: "Phòng thu âm, thường yên tĩnh.",
      example: "I'll sleep in the recording studio instead.",
    },
    {
      phrase: "quieter",
      explanationEn: "Making less noise than another place.",
      explanationVi: "Yên tĩnh hơn một nơi khác.",
      example: "The studio is quieter than the office.",
    },
    {
      phrase: "buzzing",
      explanationEn: "A low continuous sound, like a bee or a snore.",
      explanationVi: "Âm thanh rù rù liên tục, như tiếng ngáy.",
      example: "The phrase comes from the buzzing sound of snoring.",
    },
    {
      phrase: "all night",
      explanationEn: "Through the whole night.",
      explanationVi: "Suốt cả đêm.",
      example: "I practiced my accordion all night.",
    },
    {
      phrase: "not a good idea",
      explanationEn: "A plan that is likely to cause a problem.",
      explanationVi: "Một ý không hay, dễ gây rắc rối.",
      example: "Sleeping at your desk is not a good idea.",
    },
  ],
  "no-brainer": [
    {
      phrase: "no-brainer",
      explanationEn: "Something so obvious that you barely need to think.",
      explanationVi: "Việc quá rõ ràng, hầu như không cần suy nghĩ.",
      example: "Taking the earlier train was a no-brainer.",
    },
    {
      phrase: "obvious",
      explanationEn: "Easy to see or understand.",
      explanationVi: "Dễ thấy hoặc dễ hiểu ngay.",
      example: "The answer was obvious from the start.",
    },
    {
      phrase: "little thought",
      explanationEn: "Almost no thinking is required.",
      explanationVi: "Gần như không cần suy nghĩ.",
      example: "A no-brainer requires little thought.",
    },
    {
      phrase: "episode",
      explanationEn: "One part of a series, such as a TV show.",
      explanationVi: "Một tập trong một series, ví dụ phim truyền hình.",
      example: "Did you watch the new episode?",
    },
    {
      phrase: "twin",
      explanationEn: "One of two siblings born at the same time.",
      explanationVi: "Một trong hai anh chị em sinh đôi.",
      example: "What if David has a twin brother?",
    },
    {
      phrase: "the right choice",
      explanationEn: "The best decision in that situation.",
      explanationVi: "Lựa chọn đúng trong tình huống đó.",
      example: "It was easy to make the right choice.",
    },
    {
      phrase: "what if",
      explanationEn: "Used to imagine a different possibility.",
      explanationVi: "Dùng để giả sử một khả năng khác.",
      example: "What if the police don't know about the twin?",
    },
    {
      phrase: "bad at",
      explanationEn: "Not skilled at a particular activity.",
      explanationVi: "Làm một việc nào đó không giỏi.",
      example: "Then they are really bad at their jobs.",
    },
  ],
};

const summaries: Record<string, string> = {
  "on-the-ball":
    "Anna had a very productive day and finished three reports, with only one left. Andrew says she is on the ball because she works quickly and ahead of time. Anna jokes that lots of coffee is the reason and offers him some, but he does not want that much. The video explains that on the ball means working fast and well, and get on the ball means someone should work better or faster.",
  "hold-your-horses":
    "Anna asks Andrew to help with a heavy box, but he is still reading and tells her to wait. When she keeps pushing, he says hold your horses and asks what is inside. She jokes that the box is full of horses. The video explains that the idiom tells someone to be patient. It is informal, and the tone can make it sound rude.",
  "catch-some-zs":
    "Someone stayed up all night practicing the accordion and now wants to catch some Z's at their desk. A coworker says that is not a good idea because there is a lot of work to do, so they decide to sleep in the quieter recording studio instead. The video explains that catch some Z's means to sleep, and that the Z's come from the buzzing sound of snoring.",
  "no-brainer":
    "Andrew asks Anna about a new episode of Catch a Criminal. Anna says the mystery was a no-brainer because the police found a gun and all the money in David's house. Andrew wonders what if David has a twin, but Anna thinks the police would know. The video explains that a no-brainer is obvious, needs little thought, and makes the right choice easy.",
};

const reviews: Record<string, ReviewResult["questions"]> = {
  "on-the-ball": [
    {
      bloom: "remember",
      prompt: "How many reports has Anna already finished?",
      choices: ["Three", "One", "Five", "None"],
      answerIndex: 0,
      explanationEn: "Anna says she finished three reports and has one more to do.",
    },
    {
      bloom: "understand",
      prompt: "What does “on the ball” mean in this video?",
      choices: [
        "Working quickly and ahead of time",
        "Exercising with a large ball",
        "Drinking coffee all day",
        "Asking a coworker for a report",
      ],
      answerIndex: 0,
      explanationEn: "The narrator says someone on the ball finishes work quickly and ahead of time.",
    },
    {
      bloom: "apply",
      prompt: "Your classmate finishes a group project early and well. What could you say?",
      choices: [
        "You are really on the ball.",
        "Hold your horses.",
        "Catch some Z's at your desk.",
        "That mystery is a twin.",
      ],
      answerIndex: 0,
      explanationEn: "On the ball praises someone who is working quickly and effectively.",
    },
    {
      bloom: "analyze",
      prompt: "Why does Anna mention coffee?",
      choices: [
        "She jokes that coffee helped her work fast.",
        "She is selling coffee to Andrew.",
        "Coffee is the idiom the video teaches.",
        "She did not finish the reports.",
      ],
      answerIndex: 0,
      explanationEn: "Anna offers coffee as a funny reason for finishing the reports so fast.",
    },
    {
      bloom: "evaluate",
      prompt: "Which summary best matches the video?",
      choices: [
        "Anna finishes most of her reports quickly, so Andrew says she is on the ball.",
        "The video teaches people how to exercise with a ball.",
        "Andrew finished three reports and refused to talk.",
        "Anna does not like coffee and leaves work early.",
      ],
      answerIndex: 0,
      explanationEn: "The main story is Anna's fast work and the meaning of the idiom.",
    },
    {
      bloom: "create",
      prompt: "Which new sentence best continues the idea of the video?",
      choices: [
        "If I want to get on the ball tomorrow, I will start the last report before lunch.",
        "Horses are big, so I will ride one to the office.",
        "I will catch some Z's at my desk all day.",
        "The police found the money in David's house.",
      ],
      answerIndex: 0,
      explanationEn: "Get on the ball means choosing to work faster and better.",
    },
  ],
  "hold-your-horses": [
    {
      bloom: "remember",
      prompt: "What does Anna want Andrew to help her with?",
      choices: ["A heavy box", "A horse", "A report", "A cup of coffee"],
      answerIndex: 0,
      explanationEn: "Anna asks Andrew to help with a box and says it is really heavy.",
    },
    {
      bloom: "understand",
      prompt: "What is Andrew telling Anna when he says “hold your horses”?",
      choices: [
        "Wait and be patient",
        "Open the box immediately",
        "Ride the horses carefully",
        "Finish the last page for her",
      ],
      answerIndex: 0,
      explanationEn: "The idiom tells someone to wait and be patient.",
    },
    {
      bloom: "apply",
      prompt: "A friend keeps rushing you while you finish a message. What can you say?",
      choices: [
        "Hold your horses. I need one more minute.",
        "You are on the ball.",
        "Catch some Z's.",
        "That was a no-brainer.",
      ],
      answerIndex: 0,
      explanationEn: "Use the idiom when you want someone to slow down and wait.",
    },
    {
      bloom: "analyze",
      prompt: "Why can “hold your horses” sound rude?",
      choices: [
        "It is very informal, so the tone matters.",
        "It only means the box is full of horses.",
        "It is a formal phrase for managers.",
        "It means the other person is bad at their job.",
      ],
      answerIndex: 0,
      explanationEn: "The narrator says the phrase is informal and can sound rude depending on how you say it.",
    },
    {
      bloom: "evaluate",
      prompt: "Which response is the more polite way to ask Anna to wait?",
      choices: [
        "Just a second. I'm almost done.",
        "Hold your horses!",
        "Stop talking right now.",
        "Carry it yourself.",
      ],
      answerIndex: 0,
      explanationEn: "Just a second is a softer request. Hold your horses can sound sharp.",
    },
    {
      bloom: "create",
      prompt: "Which new line fits the joke at the end of the video?",
      choices: [
        "No real horses — just the heavy books I was hiding.",
        "The police found a gun in the box.",
        "I practiced the accordion all night.",
        "I finished three reports with coffee.",
      ],
      answerIndex: 0,
      explanationEn: "Anna's joke is that the box contains horses, so a new line can play with that surprise.",
    },
  ],
  "catch-some-zs": [
    {
      bloom: "remember",
      prompt: "Where does the tired person decide to sleep instead?",
      choices: [
        "In the recording studio",
        "At the desk",
        "On the train",
        "In David's house",
      ],
      answerIndex: 0,
      explanationEn: "They say the recording studio is quieter, so they will sleep there.",
    },
    {
      bloom: "understand",
      prompt: "What does “catch some Z's” mean?",
      choices: [
        "To sleep or take a nap",
        "To catch the letter Z",
        "To practice an instrument",
        "To finish work early",
      ],
      answerIndex: 0,
      explanationEn: "The narrator says the phrase means to sleep.",
    },
    {
      bloom: "apply",
      prompt: "You were up late and have a free 20 minutes. What could you say?",
      choices: [
        "I'm going to catch some Z's before class.",
        "Hold your horses, the box is heavy.",
        "That episode was a no-brainer.",
        "You are on the ball with those reports.",
      ],
      answerIndex: 0,
      explanationEn: "The phrase fits a short sleep after a late night.",
    },
    {
      bloom: "analyze",
      prompt: "Why do comics use the letter Z for sleep?",
      choices: [
        "It suggests the buzzing sound of snoring.",
        "Z is the first letter of the word sleep.",
        "Z means the person is at work.",
        "Z is the name of the recording studio.",
      ],
      answerIndex: 0,
      explanationEn: "The video connects Z's with the buzzing sound people make when they snore.",
    },
    {
      bloom: "evaluate",
      prompt: "Why is sleeping at the desk a worse plan than the studio?",
      choices: [
        "The desk is not quiet, and there is still work to do.",
        "The desk is more comfortable than a studio.",
        "The coworker wants them to snore louder.",
        "Accordion practice must happen at the desk.",
      ],
      answerIndex: 0,
      explanationEn: "The coworker says sleeping at the desk is not a good idea because they have work, and the studio is quieter.",
    },
    {
      bloom: "create",
      prompt: "Which new sentence uses the idea in a new situation?",
      choices: [
        "After the night shift, I'll catch some Z's on the bus home.",
        "Please hold your horses and open the heavy box.",
        "The police found all the money in the studio.",
        "I finished three reports ahead of time.",
      ],
      answerIndex: 0,
      explanationEn: "A new situation can still use catch some Z's to mean a short sleep.",
    },
  ],
  "no-brainer": [
    {
      bloom: "remember",
      prompt: "What did the police find in David's house?",
      choices: [
        "A gun and all the money",
        "A twin brother",
        "Three reports",
        "An accordion",
      ],
      answerIndex: 0,
      explanationEn: "Anna says the police found a gun and all the money in David's house.",
    },
    {
      bloom: "understand",
      prompt: "Why does Anna call the episode a no-brainer?",
      choices: [
        "The criminal was obvious, so she barely had to think.",
        "The show had no story.",
        "She did not watch the episode.",
        "David's twin was standing in the room.",
      ],
      answerIndex: 0,
      explanationEn: "A no-brainer is obvious and requires little thought.",
    },
    {
      bloom: "apply",
      prompt: "Two job offers are the same, but one pays more. What could you say?",
      choices: [
        "Taking the higher pay is a no-brainer.",
        "Hold your horses about the money.",
        "I need to catch some Z's at the interview.",
        "The manager is on the ball with horses.",
      ],
      answerIndex: 0,
      explanationEn: "Use no-brainer when the right choice is easy to see.",
    },
    {
      bloom: "analyze",
      prompt: "What is Andrew doing when he asks about a twin?",
      choices: [
        "He is suggesting the case might not be so obvious.",
        "He is explaining the idiom to the viewers.",
        "He is saying Anna is bad at her job.",
        "He is describing a real twin from the news.",
      ],
      answerIndex: 0,
      explanationEn: "Andrew's what-if questions test Anna's idea that the answer was obvious.",
    },
    {
      bloom: "evaluate",
      prompt: "Which judgment fits Anna's view of the police?",
      choices: [
        "If they miss a twin, they are bad at their jobs.",
        "They should sleep in the recording studio.",
        "They work too fast, like Anna's reports.",
        "They should hold their horses and drink coffee.",
      ],
      answerIndex: 0,
      explanationEn: "Anna says the police would know about a twin, or they are bad at their jobs.",
    },
    {
      bloom: "create",
      prompt: "Which new line could Anna add to defend her opinion?",
      choices: [
        "The money and the gun were in the same house, so the choice was obvious.",
        "I practiced the accordion all night in that house.",
        "Please wait, this box is full of horses.",
        "I finished three reports ahead of time.",
      ],
      answerIndex: 0,
      explanationEn: "A new line should stay with the obvious evidence in the episode.",
    },
  ],
};

const tips: Record<string, string> = {
  contentCoverage: "Hãy thêm một ý chính của video bằng lời của bạn, ví dụ ai đã làm gì và kết quả là gì.",
  range: "Thử dùng lại một cụm từ trong video theo câu của riêng bạn, đừng chỉ dùng các từ rất quen.",
  accuracy: "Kiểm tra thì của động từ và câu đã có chủ ngữ chưa. Phát âm chưa được chấm trong phiên bản này.",
  fluencyCoherence: "Nối các ý bằng because, so hoặc but để người nghe thấy mạch chuyện.",
};

const levelLead: Record<ScoreResult["overallLevel"], string> = {
  A1: "Bản tóm tắt còn rất ngắn, gần với vài cụm từ rời.",
  A2: "Bạn nói được các câu đơn về chuyện trong video.",
  B1: "Bạn nối được các ý chính thành một đoạn nói có mạch.",
  B2: "Bản tóm tắt rõ và có giải thích, sát nội dung video.",
  C1: "Bạn diễn đạt trôi chảy và bao quát được ý chính lẫn chi tiết.",
  C2: "Bản tóm tắt tự nhiên, chính xác và có sắc thái.",
};

function lessonKey(request: { lessonId?: string; transcript: string }): string | null {
  const known = lessonById(request.lessonId);
  if (known) return known.id;
  const found = lessons.find((lesson) => request.transcript.includes(lesson.transcript.slice(0, 80)));
  return found?.id ?? null;
}

function genericVocab(transcript: string): VocabResult {
  const sentences = splitSentences(transcript);
  const picked = contentWords(transcript).filter((word, index, all) => all.indexOf(word) === index);
  const phrases = picked.slice(0, 8);
  while (phrases.length < 6) phrases.push(`idea ${phrases.length + 1}`);
  return {
    items: phrases.slice(0, 8).map((phrase, index) => {
      const source =
        sentences.find((sentence) => sentence.toLowerCase().includes(phrase)) ??
        sentences[0] ??
        transcript;
      return {
        phrase,
        explanationEn: `A useful word from this video. Listen for how the speaker uses “${phrase}”.`,
        explanationVi: `Từ này xuất hiện trong video. Hãy xem câu ví dụ để hiểu cách dùng.`,
        example: source.length > 180 ? `${source.slice(0, 177)}...` : source || `People use “${phrase}” in conversation. (${index + 1})`,
      };
    }),
  };
}

function genericReview(transcript: string): ReviewResult {
  const sentences = splitSentences(transcript).filter((sentence) => sentence.length > 25);
  const fact = sentences[0] ?? "The speaker explains a useful English idea.";
  const detail = sentences[1] ?? "The video gives a short example.";
  const clip = (text: string) => (text.length > 140 ? `${text.slice(0, 137)}...` : text);
  return {
    questions: [
      {
        bloom: "remember",
        prompt: "Which line appears in the video?",
        choices: [
          clip(fact),
          "The speaker teaches a recipe for bread.",
          "Two people plan a trip to the moon.",
          "The lesson is only about writing email addresses.",
        ],
        answerIndex: 0,
        explanationEn: "That line is taken from the transcript.",
      },
      {
        bloom: "understand",
        prompt: "What is the video mainly doing?",
        choices: [
          "Explaining an idea with a short example",
          "Listing every grammar rule in English",
          "Reading a silent poem with no words",
          "Teaching only numbers from one to ten",
        ],
        answerIndex: 0,
        explanationEn: "The transcript explains an idea and supports it with an example.",
      },
      {
        bloom: "apply",
        prompt: "Which new sentence best reuses an idea from the video?",
        choices: [
          `In my own life, I can use this idea: ${clip(detail)}`,
          "I will ignore the topic and talk about the weather only.",
          "This word means the opposite of everything in the video.",
          "I should repeat the video with no changes and no summary.",
        ],
        answerIndex: 0,
        explanationEn: "Applying the idea means using it in a new sentence of your own.",
      },
      {
        bloom: "analyze",
        prompt: "Why does the speaker include an example?",
        choices: [
          "To make the meaning easier to see",
          "To hide the main idea",
          "To end the video with no explanation",
          "To change the topic completely",
        ],
        answerIndex: 0,
        explanationEn: "Examples show how the language works in a real situation.",
      },
      {
        bloom: "evaluate",
        prompt: "Which summary is stronger?",
        choices: [
          "It keeps the main idea and one concrete detail from the video.",
          "It says the video has no topic.",
          "It only lists random letters.",
          "It describes a different story that never appears.",
        ],
        answerIndex: 0,
        explanationEn: "A strong summary keeps the main idea and a real detail.",
      },
      {
        bloom: "create",
        prompt: "Which ending would you add after this video?",
        choices: [
          "Tomorrow I will use the phrase once in a real conversation.",
          "I will never look at the topic again.",
          "I will replace the story with a recipe.",
          "I will pretend the speakers said nothing.",
        ],
        answerIndex: 0,
        explanationEn: "A creative next step still has to grow out of the video's idea.",
      },
    ],
  };
}

function feedbackFor(level: ScoreResult["overallLevel"], weak: string): string {
  return `${levelLead[level]} ${tips[weak] ?? tips.contentCoverage} Phiên bản này chưa chấm phát âm.`;
}

function suggestDifficulty(
  request: Extract<PracticeRequest, { task: "difficulty" }>,
): DifficultyResult {
  const current = lessonById(request.lessonId) ?? lessonById(lessonKey(request) ?? undefined);
  const currentRank = cefrRank(request.overallLevel);
  const lessonRank = current ? cefrRank(current.level) : currentRank;
  let recommendation: DifficultyResult["recommendation"] = "stay";
  if (request.quizCorrect <= 2 || currentRank + 1 < lessonRank) recommendation = "down";
  else if (currentRank >= lessonRank + 1 && request.quizCorrect >= 4) recommendation = "up";

  const higher = lessons.find((lesson) => cefrRank(lesson.level) > lessonRank && lesson.id !== current?.id);
  const lower = [...lessons].reverse().find((lesson) => cefrRank(lesson.level) < lessonRank);
  const sameBand = lessons.find((lesson) => lesson.level === (current?.level ?? "A2") && lesson.id !== current?.id);
  const easiest = lessons[0];

  if (recommendation === "down" && !lower && easiest) {
    return {
      recommendation: "down",
      targetLevel: "A2",
      reasonVi:
        "Bài dễ nhất trong bộ này vẫn khó hơn bản tóm tắt hiện tại. Hãy xem lại và chỉ nói ba câu đơn: ai, làm gì, kết quả thế nào.",
      nextLessonId: easiest.id,
      nextTitle: easiest.title,
      nextBriefVi: "Xem lại bài này. Lần này tóm tắt bằng ba câu ngắn, chưa cần thêm chi tiết.",
    };
  }

  if (recommendation === "up" && !higher) {
    return {
      recommendation: "up",
      targetLevel: currentRank >= 3 ? request.overallLevel : "B2",
      reasonVi:
        "Bạn đã xử lý tốt các bài khoảng một phút. Nên lên một video dài hơn, nơi người nói giải thích lý do chứ không chỉ đưa một ví dụ.",
      nextLessonId: "",
      nextTitle: "A two-minute explainer: why a habit is hard to change",
      nextBriefVi:
        "Hãy tìm một video tiếng Anh khoảng 2 phút về một thói quen, dán link ở bước Nguồn, rồi tóm tắt cả vấn đề lẫn lý do. Đó là bước B2 cụ thể sau các bài B1.",
    };
  }

  const next =
    recommendation === "up" ? higher : recommendation === "down" ? (lower ?? lessons[0]) : (sameBand ?? current ?? lessons[0]);
  const reason =
    recommendation === "up"
      ? "Bản tóm tắt và phần ôn cho thấy bạn nắm ý chính. Nên lên một bài có nhiều chi tiết hơn."
      : recommendation === "down"
        ? "Ý chính còn mỏng hoặc phần ôn chưa vững. Nên xuống một bài ngắn và tóm tắt bằng câu đơn."
        : "Mức hiện tại đang vừa. Hãy giữ trình và đổi sang một bài cùng bậc để dùng cách nói trong tình huống mới.";

  return {
    recommendation,
    targetLevel: next?.level ?? request.overallLevel,
    reasonVi: reason,
    nextLessonId: next?.id ?? "",
    nextTitle: next?.title ?? "On the Ball",
    nextBriefVi: next
      ? `${next.blurbVi} Bài này ở mức ${next.level}, khoảng ${next.minutes} phút.`
      : "Chọn một video ngắn và tóm tắt ý chính.",
  };
}

export function mockPractice(request: PracticeRequest): VocabResult | ScoreResult | ReviewResult | DifficultyResult {
  const key = lessonKey(request);
  if (request.task === "vocab") {
    return key && vocabByLesson[key] ? { items: vocabByLesson[key] } : genericVocab(request.transcript);
  }
  if (request.task === "score") {
    const scores = scoreSummary(request.transcript, request.summary);
    const weak = weakestSubscore(scores);
    return {
      ...scores,
      feedbackVi: feedbackFor(scores.overallLevel, weak),
      modelSummary:
        (key && summaries[key]) ||
        splitSentences(request.transcript).slice(0, 3).join(" "),
    };
  }
  if (request.task === "review") {
    return key && reviews[key] ? { questions: reviews[key] } : genericReview(request.transcript);
  }
  return suggestDifficulty(request);
}
