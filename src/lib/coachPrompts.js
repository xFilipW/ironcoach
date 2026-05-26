import { getWorkoutStatus } from "./workoutUtils"
import { formatDashboardContext } from "./workoutAnalytics"
import { formatMeasurementsContext } from "./measurementAnalytics"
import { computeBmi } from "./measurementUtils"

export const SYSTEM_PROMPT = `Jesteś IronCoach – doświadczony trener personalny i dietetyk sportowy z wieloletnią praktyką w treningu siłowym i rekreacyjnym. Rozmawiasz po polsku, zwięźle i konkretnie, jak prawdziwy trener na sali – bez lania wody.

Twoja specjalizacja: trening siłowy (SBD i ogólnorozwojowy), HIIT, technika ćwiczeń, progresja ciężarów, periodyzacja, regeneracja, żywienie sportowe i planowanie treningów dopasowanych do realnych możliwości zawodnika.

# Charakter i styl odpowiedzi
- Mów jak trener, nie jak encyklopedia – krótko, konkretnie, z sensem. Używaj liczb i przykładów tam, gdzie pomagają.
- Jeśli czegoś nie wiesz o użytkowniku (np. jego celu, poziomu zaawansowania), zapytaj – ale tylko o jedną rzecz na raz.
- Nie powtarzaj pytania użytkownika i nie zaczynaj odpowiedzi od "Oczywiście!" ani "Świetne pytanie!".
- Nie kończ odpowiedzi frazami w stylu "Daj znać, jeśli chcesz więcej informacji" – to niepotrzebne.

# Zakres tematyczny
Odpowiadasz merytorycznie na pytania o: trening, dietę sportową, regenerację, technikę ćwiczeń, suplementację, planowanie, skład ciała, pomiary i analizę dziennika treningowego.

Pytania poza tym zakresem (matematyka, pogoda, polityka, historia itp.): odpowiedz krótko i zwięźle, a następnie wróć do tematu jednym zdaniem, np.: "To tyle z matematyki – wróćmy do treningu. Czym mogę pomóc?"

# Dane użytkownika w kontekście
Poniżej masz dostęp do trzech źródeł danych użytkownika:
- **Dashboard** – podsumowanie analityczne treningów (objętość, intensywność, częstotliwość, SBD)
- **Dziennik treningowy** – lista ukończonych i zaplanowanych treningów z ćwiczeniami, RPE, samopoczuciem i notatkami
- **Pomiary ciała** – historia pomiarów: waga, wzrost, BMI, tkanka tłuszczowa, obwody

Gdy użytkownik pyta o swoje treningi, postępy, wagę, skład ciała lub historię – zawsze korzystaj z tych danych. Nie mów, że nie masz dostępu do historii, nie proś o ponowne podanie danych. Jeśli danych faktycznie brakuje (np. brak wpisów), powiedz to wprost.

Analizując pomiary, zawsze łącz je z dziennikiem i dashboardem:
- Waga rośnie + siła rośnie → prawdopodobna czysta masa, kontynuuj
- Waga rośnie + siła stoi w miejscu → nadwyżka zbyt duża, zaproponuj redukcję kalorii
- Waga spada szybko + spada siła → deficyt zbyt agresywny, zaproponuj więcej kalorii i regeneracji
- Waga stoi + obwody rosną → możliwa rekompo, oceń objętość i dietę

# Ograniczenia medium
Ten czat obsługuje wyłącznie tekst. Nigdy nie proś użytkownika o zdjęcia, filmy ani nagrania. Zamiast tego: opisuj technikę słownie (ustawienie ciała, ruch, oddech, kąty stawów) albo poproś o opis tekstowy, jeśli potrzebujesz więcej informacji.`

export const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    text: "Cześć! Jestem **IronCoach** – Twój trener AI 💪\n\nMogę pomóc Ci z:\n• Planem treningowym dopasowanym do Twoich celów\n• Techniką ćwiczeń i progresją ciężarów\n• Regeneracją i żywieniem\n• Analizą dziennika treningowego, Dashboardu i pomiarów ciała\n\nCzym mogę Ci dziś pomóc?",
  },
]

export const QUICK_PROMPTS = [
  "Oceń mój dashboard – jak trenuję?",
  "Czy moja waga idzie w dobrym kierunku?",
  "Ułóż mi plan na kolejny tydzień",
  "Jak zoptymalizować odżywianie okołotreningowe?",
  "Sprawdź moją technikę przysiadu",
  "Ile odpoczynku potrzebuję po ciężkim tygodniu?",
]

export const CHAT_ERRORS = {
  noApiKey: "⚠️ Brak klucza API. Ustaw VITE_GEMINI_API_KEY w pliku .env i uruchom ponownie.",
  connection: "Błąd połączenia. Spróbuj ponownie.",
  truncated: "\n\n*(Odpowiedź została skrócona – wpisz 'kontynuuj', a dokończę analizę.)*",
}

function formatWorkoutBlock(w) {
  const status = getWorkoutStatus(w) === "completed" ? "ukończony" : "zaplanowany"
  const feeling = w.feeling != null ? `\nSamopoczucie: ${w.feeling}/10` : ""
  const note = w.note?.trim() ? `\nNotatka: ${w.note.trim()}` : ""
  const exercises =
    w.exercises?.length > 0
      ? w.exercises.map(line => `  • ${line}`).join("\n")
      : "  (brak ćwiczeń)"

  return `Typ: ${w.type || w.name}
Status: ${status}
Data: ${w.dateLabel || "—"}${feeling}${note}
Ćwiczenia:
${exercises}`
}

export function formatWorkoutsContext(workouts) {
  if (!workouts?.length) {
    return "\n\n=== DZIENNIK TRENINGOWY (zakładka Treningi) ===\nBrak zapisanych treningów."
  }

  const completed = workouts
    .filter(w => getWorkoutStatus(w) === "completed")
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const planned = workouts
    .filter(w => getWorkoutStatus(w) === "planned")
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const sections = ["\n\n=== DZIENNIK TRENINGOWY (zakładka Treningi) ==="]

  if (completed.length) {
    sections.push("\n--- Ukończone (od najnowszego) ---")
    completed.forEach((w, i) => sections.push(`\n[Ukończony #${i + 1}]\n${formatWorkoutBlock(w)}`))
  }

  if (planned.length) {
    sections.push("\n--- Zaplanowane (od najbliższego) ---")
    planned.forEach((w, i) => sections.push(`\n[Plan #${i + 1}]\n${formatWorkoutBlock(w)}`))
  }

  return sections.join("\n")
}

export function buildSystemPrompt(workouts, measurements) {
  return (
    SYSTEM_PROMPT +
    formatDashboardContext(workouts) +
    formatWorkoutsContext(workouts) +
    formatMeasurementsContext(measurements)
  )
}

export function buildDashboardAnalysisPrompt() {
  return `Oceń mój dashboard treningowy i daj mi konkretny feedback.

Przeanalizuj dane z kontekstu systemowego i odpowiedz w 4 sekcjach:

**1. Częstotliwość i objętość**
Czy trenuję odpowiednio często i dużo jak na swoje cele? Co wyróżnia się na plus lub minus?

**2. Intensywność, RPE i regeneracja**
Czy intensywność jest właściwa? Czy widać sygnały przetrenowania lub niedotrenowania? Jak wygląda samopoczucie na tle obciążeń?

**3. Postępy w kluczowych ćwiczeniach**
Jak zmieniały się ciężary i objętość? Czy widać progresję, stagnację lub regres?

**4. Rekomendacje na najbliższe 2–4 tygodnie**
3–5 konkretnych rzeczy do zrobienia: co zmienić, dodać lub odpuścić.`
}

export function buildWeekAnalysisPrompt(weekWorkouts, weekLabel) {
  const completed = weekWorkouts.filter(w => getWorkoutStatus(w) === "completed")
  const planned = weekWorkouts.filter(w => getWorkoutStatus(w) === "planned")

  const blocks = weekWorkouts.map((w, i) => `[Trening ${i + 1}]\n${formatWorkoutBlock(w)}`).join("\n\n")

  const feelings = completed.filter(w => w.feeling != null).map(w => w.feeling)
  const avgFeeling =
    feelings.length > 0 ? (feelings.reduce((a, b) => a + b, 0) / feelings.length).toFixed(1) : null

  const summary = [
    `Okres: ${weekLabel}`,
    `Ukończone treningi: ${completed.length}`,
    planned.length > 0 ? `Zaplanowane (nieukończone): ${planned.length}` : null,
    avgFeeling ? `Średnie samopoczucie: ${avgFeeling}/10` : null,
  ]
    .filter(Boolean)
    .join(" | ")

  return `Przeanalizuj mój tydzień treningowy.

${summary}

Szczegóły:
${blocks}

Odpowiedz w 4 sekcjach:

**1. Objętość i intensywność tygodnia**
Ile pracy zostało wykonane? Czy obciążenie było właściwe?

**2. Co poszło dobrze**
Konkretne plusy – ćwiczenia, wyniki, samopoczucie.

**3. Co poprawić w kolejnym tygodniu**
Maksymalnie 3 konkretne zmiany z uzasadnieniem.

**4. Regeneracja i planowanie**
Co zrobić przed kolejnym tygodniem? Czy potrzeba więcej odpoczynku, roztrenowania, zmiany kolejności jednostek?`
}

export function buildAnalysisPrompt(workout) {
  const exerciseList = workout.exercises.map(line => `• ${line}`).join("\n")
  const noteBlock = workout.note?.trim() ? `\n**Notatka:** ${workout.note.trim()}\n` : ""

  if (getWorkoutStatus(workout) === "planned") {
    return `Mam zaplanowany trening – oceń, czy jest dobrze zaprojektowany.

**Typ:** ${workout.type}
**Data:** ${workout.dateLabel}
${noteBlock}
**Planowane ćwiczenia:**
${exerciseList}

Odpowiedz w 3 sekcjach:

**1. Dobór i kolejność ćwiczeń**
Czy ćwiczenia są sensownie dobrane do celu i ułożone we właściwej kolejności?

**2. Obciążenie i RPE**
Czy zakres powtórzeń i intensywność są właściwe? Co ewentualnie zmienić?

**3. Korekty przed treningiem**
2–3 konkretne sugestie do wprowadzenia jeszcze przed jednostką.${noteBlock ? "\nJeśli notatka dotyczy kontuzji lub bólu – uwzględnij to w rekomendacjach." : ""}`
  }

  return `Właśnie ukończyłem trening – oceń jak mi poszło.

**Typ:** ${workout.type}
**Samopoczucie:** ${workout.feeling}/10
**Data:** ${workout.dateLabel}
${noteBlock}
**Ćwiczenia:**
${exerciseList}

Odpowiedz w 3 sekcjach:

**1. Ocena wysiłku i intensywności**
Czy obciążenie i RPE były właściwe do celu? Czy widać progresję względem poprzednich treningów?

**2. Co poszło dobrze**
Konkretne plusy z tego treningu.

**3. Co poprawić i jak się zregenerować**
Maksymalnie 3 rzeczy do poprawy następnym razem. Czy potrzeba aktywnej regeneracji, rozciągania, dodatkowego snu lub korekty żywieniowej?${noteBlock ? "\nJeśli notatka sygnalizuje ból lub dyskomfort – uwzględnij to priorytetowo." : ""}`
}

export function buildMeasurementsAnalysisPrompt(measurement) {
  const bmi = computeBmi(measurement.weightKg, measurement.heightCm)
  const details = [
    `Data: ${measurement.dateLabel}`,
    `Waga: ${measurement.weightKg} kg`,
    measurement.heightCm != null ? `Wzrost: ${measurement.heightCm} cm` : null,
    bmi != null ? `BMI: ${bmi}` : null,
    measurement.bodyFatPct != null ? `Tkanka tłuszczowa: ${measurement.bodyFatPct}%` : null,
    measurement.waistCm != null ? `Talia: ${measurement.waistCm} cm` : null,
    measurement.chestCm != null ? `Klatka: ${measurement.chestCm} cm` : null,
    measurement.hipsCm != null ? `Biodra: ${measurement.hipsCm} cm` : null,
    measurement.armCm != null ? `Ramię: ${measurement.armCm} cm` : null,
    measurement.thighCm != null ? `Udo: ${measurement.thighCm} cm` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const noteBlock = measurement.note?.trim() ? `\nNotatka: ${measurement.note.trim()}` : ""

  return `Przeanalizuj mój najnowszy pomiar ciała w kontekście treningów.

${details}${noteBlock}

Masz dostęp do pełnej historii pomiarów, dashboardu i dziennika treningowego w kontekście systemowym – korzystaj z nich.

Odpowiedz w 4 sekcjach:

**1. Trend wagi i składu ciała**
Czy waga rośnie, spada czy stoi? Jak zmienia się tkanka tłuszczowa i obwody? Jak szybkie jest tempo zmian?

**2. Ocena na tle treningów**
Czy zmiana wagi koreluje z objętością i intensywnością treningów? Czy to może być masa, redukcja, rekompo?

**3. Rekomendacje dietetyczne**
Konkretnie: ile kalorii, jaki rozkład makroskładników, co zmienić w diecie?

**4. Korekty treningowe**
Co dostosować w treningu: objętość, cardio, intensywność, regeneracja?`
}

export function buildAllMeasurementsAnalysisPrompt() {
  return `Przeanalizuj całą moją historię pomiarów ciała na tle treningów.

Masz dostęp do pełnej historii pomiarów, dashboardu i dziennika treningowego w kontekście systemowym – korzystaj z nich.

Odpowiedz w 4 sekcjach:

**1. Trend wagi i obwodów**
Jak zmieniała się waga i kluczowe obwody w czasie? Jaki jest ogólny kierunek zmian?

**2. Tempo i jakość zmian**
Czy zmiany zachodzą w zdrowym tempie? Czy widać skoki lub regres? Co je powoduje?

**3. Rekomendacje dietetyczne**
Konkretnie: kalorie, makro, co warto zmienić lub utrzymać.

**4. Korekty treningowe**
Co dostosować: cardio, objętość siłowa, intensywność, regeneracja?`
}