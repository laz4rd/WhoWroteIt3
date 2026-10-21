const TOPICS = [
  "Apples",
  "Mumbai Monsoon",
  "Cricket",
  "Hostel Food",
  "College Exams",
  "Engineering",
  "Chai",
  "Trains",
  "Canteen",
  "Late-Night Studying",
  "Group Projects",
  "Coding",
  "Attendance",
  "Rain",
  "College Festivals",
  "First-Year Life",
];

let recentHistory: string[] = [];

/** Picks a random topic, avoiding the last couple of topics shown. */
export function pickTopic(): string {
  const candidates = TOPICS.filter((t) => !recentHistory.includes(t));
  const pool = candidates.length > 0 ? candidates : TOPICS;
  const topic = pool[Math.floor(Math.random() * pool.length)];

  recentHistory.push(topic);
  if (recentHistory.length > 3) recentHistory.shift();

  return topic;
}

export function resetTopicHistory(): void {
  recentHistory = [];
}
