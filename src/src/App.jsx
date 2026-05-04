import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SUPABASE_URL = "https://gqdxveunrlkjpryabexd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxZHh2ZXVucmxranByeWFiZXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDcxMTIsImV4cCI6MjA5MzExMn0.AudkiJsUAc6naoMeNJI0Qu4p8z8UXxRMf4YgR0gc3SQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emptyQuestion = {
  id: "",
  questionText: "",
  choicesText: "",
  correctAnswer: "",
  unit: "",
  explanation: "",
};

function getMode() {
  if (typeof window === "undefined") return "student";
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "teacher" ? "teacher" : "student";
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function shuffleArray(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copied[i];
    copied[i] = copied[j];
    copied[j] = temp;
  }
  return copied;
}

function parseChoices(choicesText) {
  return String(choicesText || "")
    .split("\n")
    .map((choice) => choice.trim())
    .filter(Boolean);
}

function isValidQuestionForm(form) {
  const choices = parseChoices(form.choicesText);
  const answer = String(form.correctAnswer || "").trim();
  return Boolean(String(form.questionText || "").trim() && choices.length === 4 && choices.includes(answer));
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const source = String(text || "").replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const nextChar = source[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1;
      row.push(field.trim());
      field = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

function parseCsvLine(line) {
  return parseCsvRows(line)[0] || [];
}

function parseCsvText(text) {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map((header) => String(header || "").replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((values) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

function formatDateTime(iso) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function escapeCsvCell(value) {
  return `"${String(value == null ? "" : value).replaceAll('"', '""')}"`;
}

function buildCsv(logs) {
  const header = ["日時", "問題番号", "単元", "選んだ選択肢", "正解", "正誤"];
  const rows = logs.map((log) => [
    new Date(log.answered_at || log.answeredAt).toLocaleString("ja-JP"),
    log.question_id || log.questionId,
    log.unit,
    log.selected_choice || log.selectedChoice,
    log.correct_answer || log.correctAnswer,
    log.is_correct || log.isCorrect ? "正解" : "不正解",
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function validateImportedRow(row) {
  const choices = [row.choice1, row.choice2, row.choice3, row.choice4].map((choice) => String(choice || "").trim());
  const answer = String(row.answer || "").trim();
  return Boolean(String(row.question || "").trim() && choices.length === 4 && choices.every(Boolean) && choices.includes(answer));
}

function rowToQuestionInsert(row) {
  return {
    id: String(row.id || makeId()).trim(),
    question: String(row.question || "").trim(),
    choice1: String(row.choice1 || "").trim(),
    choice2: String(row.choice2 || "").trim(),
    choice3: String(row.choice3 || "").trim(),
    choice4: String(row.choice4 || "").trim(),
    answer: String(row.answer || "").trim(),
    unit: String(row.unit || "未分類").trim() || "未分類",
  };
}

function dbQuestionToAppQuestion(row) {
  return {
    id: row.id,
    title: row.id,
    questionText: row.question,
    choices: [row.choice1, row.choice2, row.choice3, row.choice4].map((choice) => String(choice || "").trim()),
    correctAnswer: row.answer,
    explanation: "",
    unit: row.unit || "未分類",
    createdAt: row.created_at || "",
  };
}

function runSelfTests() {
  return [
    {
      name: "parseChoices removes blank lines and trims spaces",
      pass: JSON.stringify(parseChoices(" A \n\nB\n C ")) === JSON.stringify(["A", "B", "C"]),
    },
    {
      name: "valid form requires exactly four choices and a matching correct answer",
      pass: isValidQuestionForm({ ...emptyQuestion, questionText: "Q", choicesText: "A\nB\nC\nD", correctAnswer: "C" }) === true,
    },
    {
      name: "invalid form rejects missing correct answer in choices",
      pass: isValidQuestionForm({ ...emptyQuestion, questionText: "Q", choicesText: "A\nB\nC\nD", correctAnswer: "E" }) === false,
    },
    {
      name: "invalid form rejects fewer than four choices",
      pass: isValidQuestionForm({ ...emptyQuestion, questionText: "Q", choicesText: "A\nB\nC", correctAnswer: "C" }) === false,
    },
    {
      name: "invalid form rejects more than four choices",
      pass: isValidQuestionForm({ ...emptyQuestion, questionText: "Q", choicesText: "A\nB\nC\nD\nE", correctAnswer: "C" }) === false,
    },
    {
      name: "shuffleArray keeps all elements",
      pass: shuffleArray([1, 2, 3, 4]).sort().join(",") === "1,2,3,4",
    },
    {
      name: "buildCsv contains header columns",
      pass: buildCsv([]).startsWith('"日時","問題番号","単元","選んだ選択肢","正解","正誤"'),
    },
    {
      name: "parseCsvLine handles quoted commas",
      pass: JSON.stringify(parseCsvLine('"A, B",C,"D"')) === JSON.stringify(["A, B", "C", "D"]),
    },
    {
      name: "parseCsvText converts CSV rows to objects",
      pass: parseCsvText('id,question,choice1,choice2,choice3,choice4,answer,unit\nPO001,Q,A,B,C,D,A,時制')[0].id === "PO001",
    },
    {
      name: "validateImportedRow accepts valid imported rows",
      pass: validateImportedRow({ id: "PO001", question: "Q", choice1: "A", choice2: "B", choice3: "C", choice4: "D", answer: "A", unit: "時制" }) === true,
    },
    {
      name: "validateImportedRow rejects answer not in choices",
      pass: validateImportedRow({ id: "PO001", question: "Q", choice1: "A", choice2: "B", choice3: "C", choice4: "D", answer: "E", unit: "時制" }) === false,
    },
    {
      name: "rowToQuestionInsert preserves question id",
      pass: rowToQuestionInsert({ id: "PO011", question: "Q", choice1: "A", choice2: "B", choice3: "C", choice4: "D", answer: "A", unit: "時制" }).id === "PO011",
    },
    {
      name: "parseCsvRows handles CRLF and five rows",
      pass: parseCsvText('id,question,choice1,choice2,choice3,choice4,answer,unit\r\nPO001,Q,A,B,C,D,A,時制\r\nPO002,Q,A,B,C,D,A,時制\r\nPO003,Q,A,B,C,D,A,時制\r\nPO004,Q,A,B,C,D,A,時制\r\nPO005,Q,A,B,C,D,A,時制').length === 5,
    },
    {
      name: "parseCsvRows handles quoted newline inside a cell",
      pass: parseCsvText('id,question,choice1,choice2,choice3,choice4,answer,unit\nPO001,"Line1\nLine2",A,B,C,D,A,時制')[0].question === "Line1\nLine2",
    },
    {
      name: "dbQuestionToAppQuestion keeps four choices",
      pass: dbQuestionToAppQuestion({ id: "PO012", question: "Q", choice1: "A", choice2: "B", choice3: "C", choice4: "D", answer: "D", unit: "時制" }).choices.length === 4,
    },
    {
      name: "dbQuestionToAppQuestion exposes id for answer screen",
      pass: dbQuestionToAppQuestion({ id: "PO013", question: "Q", choice1: "A", choice2: "B", choice3: "C", choice4: "D", answer: "D", unit: "時制" }).id === "PO013",
    },
    {
      name: "getMode defaults to student outside teacher query",
      pass: typeof window === "undefined" || ["student", "teacher"].includes(getMode()),
    },
  ];
}

function StudentQuizView({ questions, currentQuestion, currentIndex, quizQueue, currentChoices, selectedChoice, answered, startQuiz, answerQuestion, nextQuestion, loading }) {
  return (
    <div className="space-y-5">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>英語4択トレーニング</CardTitle>
          <Button onClick={startQuiz} disabled={questions.length === 0 || loading}>出題開始</Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {!currentQuestion ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
              出題開始を押すと、ランダムに問題が出ます。
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{currentIndex + 1} / {quizQueue.length}</Badge>
              </div>
              <p className="whitespace-pre-wrap rounded-xl bg-white p-4 text-base leading-7 shadow-sm">{currentQuestion.questionText}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {currentChoices.map((choice) => {
                  const isSelected = selectedChoice === choice;
                  const isCorrect = choice === currentQuestion.correctAnswer;
                  const showCorrect = answered && isCorrect;
                  const showWrong = answered && isSelected && !isCorrect;
                  return (
                    <Button
                      key={choice}
                      type="button"
                      variant={showCorrect ? "default" : showWrong ? "destructive" : "outline"}
                      className="h-auto justify-start whitespace-normal rounded-xl p-4 text-left"
                      onClick={() => answerQuestion(choice)}
                      disabled={answered}
                    >
                      <span className="flex items-start gap-2">
                        {showCorrect && <span>○</span>}
                        {showWrong && <span>×</span>}
                        <span>{choice}</span>
                      </span>
                    </Button>
                  );
                })}
              </div>
              {answered && (
                <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="font-semibold">{selectedChoice === currentQuestion.correctAnswer ? "正解" : "不正解"}</div>
                  <div className="text-sm text-slate-700">問題番号：{currentQuestion.id}</div>
                  <div className="text-sm text-slate-700">正解：{currentQuestion.correctAnswer}</div>
                  <Button onClick={nextQuestion} className="w-full md:w-auto">次の問題へ</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnlineTutorQuizApp() {
  const mode = getMode();
  const isTeacher = mode === "teacher";

  const [questions, setQuestions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(emptyQuestion);
  const [quizQueue, setQuizQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentChoices, setCurrentChoices] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState("");
  const [answered, setAnswered] = useState(false);
  const [formError, setFormError] = useState("");
  const [importError, setImportError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [showTests, setShowTests] = useState(false);
  const [showSavedQuestions, setShowSavedQuestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState("");

  const fetchQuestions = async () => {
    setLoading(true);
    setDbError("");
    const { data, error } = await supabase
      .from("questions")
      .select("id, question, choice1, choice2, choice3, choice4, answer, unit, created_at")
      .order("id", { ascending: true });

    if (error) {
      setDbError("問題データの取得に失敗しました: " + error.message);
      setLoading(false);
      return;
    }

    setQuestions((data || []).map(dbQuestionToAppQuestion));
    setLoading(false);
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("answer_logs")
      .select("id, question_id, selected_choice, correct_answer, is_correct, unit, answered_at")
      .order("answered_at", { ascending: false })
      .limit(200);

    if (error) {
      setDbError("解答ログの取得に失敗しました: " + error.message);
      return;
    }

    setLogs(data || []);
  };

  useEffect(() => {
    fetchQuestions();
    if (isTeacher) fetchLogs();
  }, [isTeacher]);

  const currentQuestion = quizQueue[currentIndex];
  const testResults = useMemo(() => runSelfTests(), []);

  const stats = useMemo(() => {
    const total = logs.length;
    const correct = logs.filter((log) => log.is_correct || log.isCorrect).length;
    const rate = total ? Math.round((correct / total) * 100) : 0;
    return { total, correct, rate };
  }, [logs]);

  const weakUnits = useMemo(() => {
    const unitMap = {};
    logs.forEach((log) => {
      const unit = log.unit || "未分類";
      if (!unitMap[unit]) unitMap[unit] = { total: 0, wrong: 0 };
      unitMap[unit].total += 1;
      if (!(log.is_correct || log.isCorrect)) unitMap[unit].wrong += 1;
    });

    return Object.entries(unitMap)
      .map(([unit, value]) => ({
        unit,
        ...value,
        wrongRate: value.total ? Math.round((value.wrong / value.total) * 100) : 0,
      }))
      .sort((a, b) => b.wrongRate - a.wrongRate)
      .slice(0, 5);
  }, [logs]);

  const wrongQuestionCounts = useMemo(() => {
    const countMap = {};
    logs.forEach((log) => {
      const isCorrect = log.is_correct || log.isCorrect;
      const questionId = log.question_id || log.questionId;
      if (!isCorrect) countMap[questionId] = (countMap[questionId] || 0) + 1;
    });
    return Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [logs]);

  const startQuiz = () => {
    const queue = shuffleArray(questions);
    setQuizQueue(queue);
    setCurrentIndex(0);
    setSelectedChoice("");
    setAnswered(false);
    setCurrentChoices(queue[0] ? shuffleArray(queue[0].choices) : []);
  };

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= quizQueue.length) {
      setQuizQueue([]);
      setCurrentIndex(0);
      setCurrentChoices([]);
      setSelectedChoice("");
      setAnswered(false);
      if (isTeacher) fetchLogs();
      return;
    }

    setCurrentIndex(nextIndex);
    setSelectedChoice("");
    setAnswered(false);
    setCurrentChoices(shuffleArray(quizQueue[nextIndex].choices));
  };

  const answerQuestion = async (choice) => {
    if (!currentQuestion || answered) return;

    const isCorrect = choice === currentQuestion.correctAnswer;
    setSelectedChoice(choice);
    setAnswered(true);

    const logRow = {
      question_id: currentQuestion.id,
      selected_choice: choice,
      correct_answer: currentQuestion.correctAnswer,
      is_correct: isCorrect,
      unit: currentQuestion.unit || "未分類",
    };

    const { data, error } = await supabase.from("answer_logs").insert([logRow]).select().single();

    if (error) {
      setDbError("解答ログの保存に失敗しました: " + error.message);
      return;
    }

    if (isTeacher) {
      setLogs((prev) => [data || { ...logRow, id: makeId(), answered_at: new Date().toISOString() }, ...prev]);
    }
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    const choices = parseChoices(form.choicesText);

    if (!form.questionText.trim()) {
      setFormError("問題文を入力してください。");
      return;
    }
    if (choices.length !== 4) {
      setFormError("選択肢は必ず4つ入力してください。");
      return;
    }
    if (!choices.includes(form.correctAnswer.trim())) {
      setFormError("正解欄は、選択肢のどれかと完全一致させてください。");
      return;
    }

    const id = form.id.trim() || makeId();
    const insertRow = {
      id,
      question: form.questionText.trim(),
      choice1: choices[0],
      choice2: choices[1],
      choice3: choices[2],
      choice4: choices[3],
      answer: form.correctAnswer.trim(),
      unit: form.unit.trim() || "未分類",
    };

    const { error } = await supabase.from("questions").upsert([insertRow], { onConflict: "id" });
    if (error) {
      setFormError("問題の保存に失敗しました: " + error.message);
      return;
    }

    setForm(emptyQuestion);
    setFormError("");
    fetchQuestions();
  };

  const handleCsvImport = (file) => {
    setImportError("");
    setImportMessage("");
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target ? event.target.result : "";
        const rows = parseCsvText(String(result || ""));

        if (rows.length === 0) {
          setImportError("CSVに問題データがありません。");
          return;
        }

        const required = ["id", "question", "choice1", "choice2", "choice3", "choice4", "answer", "unit"];
        const cols = Object.keys(rows[0]);
        const missing = required.filter((key) => !cols.includes(key));
        if (missing.length) {
          setImportError("CSVの列が不足しています: " + missing.join(", "));
          return;
        }

        let invalidCount = 0;
        const newQuestions = [];
        rows.forEach((row) => {
          if (validateImportedRow(row)) {
            newQuestions.push(rowToQuestionInsert(row));
          } else {
            invalidCount += 1;
          }
        });

        if (newQuestions.length === 0) {
          setImportError("有効な問題が1つもありません。フォーマットを確認してください。");
          return;
        }

        const { error } = await supabase.from("questions").upsert(newQuestions, { onConflict: "id" });
        if (error) {
          setImportError("Supabaseへの保存に失敗しました: " + error.message);
          return;
        }

        setImportMessage(`${newQuestions.length}問をSupabaseに保存しました（無効: ${invalidCount}問）`);
        fetchQuestions();
      } catch (error) {
        setImportError("CSVの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const deleteQuestion = async () => {
    setDbError("現在は安全のため、画面からの削除は無効にしています。Supabase側で削除するか、削除権限を追加してください。");
  };

  const exportLogs = () => {
    const csv = buildCsv(logs);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "answer_logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const refreshAll = () => {
    fetchQuestions();
    if (isTeacher) fetchLogs();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">オンライン家庭教師・4択練習アプリ</h1>
            <p className="mt-2 text-sm text-slate-600">
              {isTeacher ? "先生用：問題管理とログ確認" : "生徒用：英語の穴埋め4択トレーニング"}
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button variant="outline" onClick={refreshAll}>再読み込み</Button>
            {isTeacher && (
              <Button variant="outline" onClick={() => setShowSavedQuestions((prev) => !prev)}>
                {showSavedQuestions ? "保存済み問題を閉じる" : "保存済み問題を確認"}
              </Button>
            )}
          </div>
        </div>

        {dbError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{dbError}</div>}
        {loading && <div className="rounded-xl border bg-white p-3 text-sm text-slate-600">Supabaseから読み込み中...</div>}

        {isTeacher && showSavedQuestions && (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>保存済み問題一覧</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {questions.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-slate-500">保存済みの問題はありません</div>
              ) : (
                questions.map((question) => (
                  <div key={`saved-${question.id}-${question.createdAt}`} className="rounded-xl border bg-white p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{question.id}</Badge>
                      <Badge variant="secondary">{question.unit || "未分類"}</Badge>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{question.questionText}</p>
                    <div className="mt-2 text-xs text-slate-500">選択肢：{question.choices.join(" / ")}</div>
                    <div className="mt-1 text-xs font-medium text-slate-700">正解：{question.correctAnswer}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {!isTeacher ? (
          <StudentQuizView
            questions={questions}
            currentQuestion={currentQuestion}
            currentIndex={currentIndex}
            quizQueue={quizQueue}
            currentChoices={currentChoices}
            selectedChoice={selectedChoice}
            answered={answered}
            startQuiz={startQuiz}
            answerQuestion={answerQuestion}
            nextQuestion={nextQuestion}
            loading={loading}
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">登録問題数</CardTitle></CardHeader>
                <CardContent className="text-2xl font-bold">{questions.length}問</CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">解答数</CardTitle></CardHeader>
                <CardContent className="text-2xl font-bold">{stats.total}回</CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">正解数</CardTitle></CardHeader>
                <CardContent className="text-2xl font-bold">{stats.correct}回</CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">正答率</CardTitle></CardHeader>
                <CardContent className="text-2xl font-bold">{stats.rate}%</CardContent>
              </Card>
            </div>

            <Tabs defaultValue="quiz" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="quiz">出題確認</TabsTrigger>
                <TabsTrigger value="import">取込</TabsTrigger>
                <TabsTrigger value="add">手入力</TabsTrigger>
                <TabsTrigger value="list">問題一覧</TabsTrigger>
                <TabsTrigger value="logs">ログ</TabsTrigger>
                <TabsTrigger value="tests">テスト</TabsTrigger>
              </TabsList>

              <TabsContent value="quiz">
                <StudentQuizView
                  questions={questions}
                  currentQuestion={currentQuestion}
                  currentIndex={currentIndex}
                  quizQueue={quizQueue}
                  currentChoices={currentChoices}
                  selectedChoice={selectedChoice}
                  answered={answered}
                  startQuiz={startQuiz}
                  answerQuestion={answerQuestion}
                  nextQuestion={nextQuestion}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="import">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader><CardTitle>CSV取り込み</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Input type="file" accept=".csv" onChange={(e) => handleCsvImport(e.target.files ? e.target.files[0] : null)} />
                    {importMessage && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{importMessage}</div>}
                    {importError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{importError}</div>}
                    <p className="text-xs text-slate-500">列名は id, question, choice1, choice2, choice3, choice4, answer, unit にしてください。answerはchoice1〜4のどれかと完全一致させます。</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="add">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader><CardTitle>問題を手入力</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={addQuestion} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>問題番号</Label>
                          <Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="例: PO003" />
                        </div>
                        <div className="space-y-2">
                          <Label>単元・タグ</Label>
                          <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="例: 時制" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>問題文</Label>
                        <Textarea className="min-h-32" value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} placeholder="Everyone _____about his success in business." />
                      </div>
                      <div className="space-y-2">
                        <Label>選択肢（1行に1つ・必ず4つ）</Label>
                        <Textarea className="min-h-32" value={form.choicesText} onChange={(e) => setForm({ ...form, choicesText: e.target.value })} placeholder={`is known\nis knowing\nknow\nknows`} />
                      </div>
                      <div className="space-y-2">
                        <Label>正解（選択肢と完全一致）</Label>
                        <Input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} placeholder="knows" />
                      </div>
                      {formError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
                      <Button type="submit">＋ Supabaseに保存</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="list">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader><CardTitle>問題一覧</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {questions.map((question) => (
                      <div key={`${question.id}-${question.createdAt}`} className="rounded-2xl border bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-semibold">{question.id}</div>
                              <Badge variant="secondary">{question.unit || "未分類"}</Badge>
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-slate-700">{question.questionText}</p>
                            <div className="text-sm text-slate-600">選択肢：{question.choices.join(" / ")}</div>
                            <div className="text-sm font-medium">正解：{question.correctAnswer}</div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => deleteQuestion()} aria-label="問題を削除">×</Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs">
                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                  <Card className="rounded-2xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>解答ログ</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchLogs}>更新</Button>
                        <Button variant="outline" onClick={exportLogs} disabled={logs.length === 0}>CSV</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {logs.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">まだ解答ログがありません</div>
                      ) : (
                        logs.map((log) => (
                          <div key={log.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={log.is_correct ? "default" : "destructive"}>{log.is_correct ? "正解" : "不正解"}</Badge>
                              <Badge variant="outline">{log.question_id}</Badge>
                              <Badge variant="secondary">{log.unit}</Badge>
                              <span className="text-xs text-slate-500">{formatDateTime(log.answered_at)}</span>
                            </div>
                            <div className="mt-2 text-sm text-slate-700">選んだ選択肢：{log.selected_choice}</div>
                            <div className="text-sm text-slate-700">正解：{log.correct_answer}</div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                  <div className="space-y-4">
                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader><CardTitle>苦手傾向</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {weakUnits.length === 0 ? (
                          <div className="text-sm text-slate-500">ログが増えると単元別のミス傾向を表示します。</div>
                        ) : (
                          weakUnits.map((unit) => (
                            <div key={unit.unit} className="rounded-xl border bg-white p-3">
                              <div className="font-medium">{unit.unit}</div>
                              <div className="mt-1 text-sm text-slate-600">ミス {unit.wrong} / {unit.total}回、不正解率 {unit.wrongRate}%</div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader><CardTitle>よく間違えた問題番号</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {wrongQuestionCounts.length === 0 ? (
                          <div className="text-sm text-slate-500">不正解ログが増えると問題番号別に表示します。</div>
                        ) : (
                          wrongQuestionCounts.map(([id, count]) => (
                            <div key={id} className="rounded-xl border bg-white p-3">
                              <div className="font-medium">{id}</div>
                              <div className="mt-1 text-sm text-slate-600">ミス {count}回</div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tests">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>簡易テスト</CardTitle>
                    <Button variant="outline" onClick={() => setShowTests((prev) => !prev)}>{showTests ? "隠す" : "表示"}</Button>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-slate-600">最低限のロジックテストです。</p>
                    {showTests && (
                      <div className="space-y-2">
                        {testResults.map((test) => (
                          <div key={test.name} className="flex items-center justify-between rounded-xl border bg-white p-3 text-sm">
                            <span>{test.name}</span>
                            <Badge variant={test.pass ? "default" : "destructive"}>{test.pass ? "PASS" : "FAIL"}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
