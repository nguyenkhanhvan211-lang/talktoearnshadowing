import type { CefrLevel } from "@/lib/schemas";

export type Lesson = {
  id: string;
  youtubeId: string;
  title: string;
  blurbVi: string;
  level: CefrLevel;
  minutes: number;
  transcript: string;
};

export const lessons: Lesson[] = [
  {
    id: "on-the-ball",
    youtubeId: "DLi2txV9IVc",
    title: "On the Ball",
    blurbVi: "Anna kể một ngày làm việc rất hiệu quả. Học cách khen ai đó làm việc nhanh.",
    level: "A2",
    minutes: 1,
    transcript: `Welcome to English in a Minute! Some people use a large ball for exercise. Is that what to get "on the ball" means? Andrew: Hi Anna! How has your day been? Anna: Great! Very great! Very productive! I finished three reports and have only one more to do! Andrew: Wow, you are on the ball! How did you do them so fast? Anna: Coffee! Lots of coffee. Do you want some? I'll get it. I'd love more coffee. Thank you! Andrew: Uh, sure. But maybe not that much coffee. Someone who is "on the ball" finishes work quickly and ahead of time. We can also say a person should "get on the ball" when they need to work better or faster. And that's English in a Minute!`,
  },
  {
    id: "hold-your-horses",
    youtubeId: "mqPgWweY1vA",
    title: "Hold Your Horses",
    blurbVi: "Anna nhờ khuân một cái hộp, Andrew bảo cô chờ. Học cách nói “khoan đã”.",
    level: "A2",
    minutes: 1,
    transcript: `Welcome to English in a Minute! Horses are big and strong. Riding them takes skill and strength. So, is the idiom "hold your horses" about controlling horses? Anna: Oh! Andrew, can you help me with this box? Andrew: Just a second. I'm almost done. Anna: Andrew, the box! Andrew: I'm on the last page. Anna: It's really heavy! Andrew: Hold your horses! What's in the box? Anna: Horses! "Hold your horses" is a way of telling someone to wait, to be patient. It's very informal. And depending on how you say it, it could sound rude. And that's English in a Minute!`,
  },
  {
    id: "catch-some-zs",
    youtubeId: "ArI3CaqsEok",
    title: "Catch Some Z's",
    blurbVi: "Một người muốn ngủ gật ngay tại bàn. Học cách nói “ngủ một chút”.",
    level: "B1",
    minutes: 1,
    transcript: `Welcome to English in a Minute! Z is the last letter of the alphabet. So, what does it mean to catch some Z's? Let's find out. What time did you go to bed last night? Too late! I practiced my accordion all night. Well, we have a lot of work to do today. Just let me catch some Z's at my desk. That's not a good idea. Hmm, you're right! I'll sleep in the recording studio instead. It's quieter there. To "catch some Z's" means to sleep. Some people snore when they sleep. So, this term comes from the buzzing sound of snoring. Comics and even emojis use Z's to represent sleep. And that's English in a Minute!`,
  },
  {
    id: "no-brainer",
    youtubeId: "b_ka3-253h0",
    title: "No Brainer",
    blurbVi: "Anna bàn một tập phim mà đáp án quá rõ. Học cách nói “quá dễ đoán”.",
    level: "B1",
    minutes: 1,
    transcript: `Welcome to English in a Minute! We have to use our brains to think. So, what does the expression "no brainer" mean? Andrew: Hey, did you watch the new episode of Catch a Criminal? Anna: Yeah, but it was such a no-brainer! The police found a gun and all the money in David's house! Andrew: Well, what if David has a twin who lives with him? Anna: The police would know if David had a twin brother. Andrew: Well, what if they don't know? Anna: Then they are really bad at their jobs! A no-brainer is something that requires little thought or is obvious. It also means it is easy to make the right choice. And that's English in a Minute!`,
  },
];

export function lessonById(id: string | undefined): Lesson | null {
  if (!id) return null;
  return lessons.find((lesson) => lesson.id === id) ?? null;
}
