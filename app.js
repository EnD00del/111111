console.log("Short Quests 앱: 여러 퀘스트 버전 시작");

// 1. 날짜 도우미 함수
// 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // 0~11이라 +1
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


// 2. 상태(state)
// 여러 퀘스트를 담는 배열
let quests = [];                // 각 요소: { id, title, totalAmount, unit, records: [{date, amount}, ...] }
let currentQuestId = null;      // 지금 선택된 퀘스트의 id

// 현재 선택된 퀘스트 객체를 반환하는 함수
function getCurrentQuest() {
  if (currentQuestId === null) return null;
  return quests.find(q => q.id === currentQuestId) || null;
}


// 3. HTML 요소 가져오기
const goalTitleInput   = document.getElementById("goal-title");
const goalTotalInput   = document.getElementById("goal-total");
const goalUnitInput    = document.getElementById("goal-unit");
const setGoalButton    = document.getElementById("set-goal");

const questListEl      = document.getElementById("quest-list");

const goalSummary      = document.getElementById("goal-summary");
const progressBar      = document.getElementById("progress-bar");
const progressText     = document.getElementById("progress-text");

const todayLabel       = document.getElementById("today-label");
const todayAmountInput = document.getElementById("today-amount");
const addTodayButton   = document.getElementById("add-today");

const recordListEl     = document.getElementById("record-list");


// 4. 렌더링 함수들
// 퀘스트 목록을 화면에 그리기
function renderQuestList() {
  // 기존 내용 지우기
  questListEl.innerHTML = "";

  if (quests.length === 0) {
    const li = document.createElement("li");
    li.textContent = "퀘스트가 없습니다.";
    questListEl.appendChild(li);
    return;
  }

  // 각 퀘스트에 대해 <li> 만들기
  for (const quest of quests) {
    const li = document.createElement("li");

    // 이 퀘스트의 총 진행량 계산
    const sum = quest.records.reduce((acc, r) => acc + r.amount, 0);
    const progress = quest.totalAmount > 0 ? Math.min(100, Math.round(sum / quest.totalAmount * 100)) : 0;

    // 현재 선택된 퀘스트 표시용
    const isCurrent = quest.id === currentQuestId;

    // li에 텍스트
    li.textContent = `${quest.title} - ${sum}/${quest.totalAmount} ${quest.unit} (${progress}%)`;
    if (isCurrent) {
      li.textContent += "  ← 선택됨";
    }

    // "보기" 버튼
    const viewButton = document.createElement("button");
    viewButton.textContent = "보기";
    viewButton.addEventListener("click", () => {
      currentQuestId = quest.id;
      saveQuestsToStorage();
      updateQuestView();
    });

    // "삭제" 버튼
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "삭제";
    deleteButton.style.marginLeft = "8px";
    deleteButton.addEventListener("click", () => {
      const ok = confirm(`정말 "${quest.title}" 퀘스트를 삭제할까요?`);
      if (!ok) return;

      // 이 퀘스트를 제외한 나머지만 남기기
      quests = quests.filter(q => q.id !== quest.id);

      // 만약 삭제한 퀘스트가 현재 선택된 퀘스트였다면
      if (currentQuestId === quest.id) {
        if (quests.length > 0) {
          currentQuestId = quests[0].id; // 첫 번째 퀘스트를 선택
        } else {
          currentQuestId = null;         // 아무 것도 없음
        }
      }

      saveQuestsToStorage();
      updateQuestView();
    });

    // li에 버튼들 붙이기
    li.appendChild(document.createTextNode(" "));
    li.appendChild(viewButton);
    li.appendChild(deleteButton);

    questListEl.appendChild(li);
  }
}

// 날짜별 기록을 화면에 그리기
function renderRecordList() {
  recordListEl.innerHTML = "";

  const quest = getCurrentQuest();
  if (!quest) {
    const li = document.createElement("li");
    li.textContent = "선택된 퀘스트가 없습니다.";
    recordListEl.appendChild(li);
    return;
  }

  if (quest.records.length === 0) {
    const li = document.createElement("li");
    li.textContent = "기록이 없습니다.";
    recordListEl.appendChild(li);
    return;
  }

  // 날짜순 정렬
  const sorted = [...quest.records].sort((a, b) => a.date.localeCompare(b.date));

  for (const r of sorted) {
    const li = document.createElement("li");
    li.textContent = `${r.date}: ${r.amount} ${quest.unit}`;
    recordListEl.appendChild(li);
  }
}

// 전체 UI 업데이트
function updateQuestView() {
  // 오늘 날짜 표시
  todayLabel.textContent = `오늘 날짜: ${getTodayKey()}`;

  // 목록 / 기록 리스트 갱신
  renderQuestList();
  renderRecordList();

  const quest = getCurrentQuest();
  if (!quest) {
    goalSummary.textContent = "선택된 퀘스트가 없습니다.";
    progressBar.style.width = "0%";
    progressText.textContent = "0% 완료";
    return;
  }

  const totalDone = quest.records.reduce((sum, r) => sum + r.amount, 0);
  const progress  = quest.totalAmount > 0 ? totalDone / quest.totalAmount : 0;
  const percent   = Math.min(100, Math.round(progress * 100));

  goalSummary.textContent =
    `${quest.title} - 현재 ${totalDone}/${quest.totalAmount} ${quest.unit}`;

  progressBar.style.width = percent + "%";
  progressText.textContent = `${percent}% 완료`;

  if (progress >= 1) {
    progressText.textContent += " 🎉 퀘스트 완료!";
  }
}


// 5. localStorage 저장/불러오기
const STORAGE_KEY = "shortQuests.v2";

function saveQuestsToStorage() {
  const data = {
    quests: quests,
    currentQuestId: currentQuestId
  };
  const json = JSON.stringify(data);
  localStorage.setItem(STORAGE_KEY, json);
}

function loadQuestsFromStorage() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) {
    updateQuestView();
    return;
  }

  try {
    const data = JSON.parse(json);
    quests = Array.isArray(data.quests) ? data.quests : [];
    currentQuestId = data.currentQuestId ?? null;

    // currentQuestId가 유효한지 검사
    if (!getCurrentQuest() && quests.length > 0) {
      currentQuestId = quests[0].id;
    }

    updateQuestView();
  } catch (e) {
    console.error("저장된 데이터를 읽는 중 오류:", e);
    quests = [];
    currentQuestId = null;
    updateQuestView();
  }
}


// 6. 이벤트 핸들러
// 새 퀘스트 만들기
setGoalButton.addEventListener("click", () => {
  const title = goalTitleInput.value.trim();
  const total = Number(goalTotalInput.value);
  const unit  = goalUnitInput.value.trim() || "단위";

  if (!title || !total || total <= 0) {
    alert("퀘스트 이름과 총량을 제대로 입력해 주세요!");
    return;
  }

  const newQuest = {
    id: Date.now(),   // 간단한 고유 id
    title: title,
    totalAmount: total,
    unit: unit,
    records: []       // 날짜별 기록 비어있는 상태로 시작
  };

  quests.push(newQuest);
  currentQuestId = newQuest.id;

  // 입력칸 비우기
  goalTitleInput.value = "";
  goalTotalInput.value = "";
  goalUnitInput.value  = "";

  saveQuestsToStorage();
  updateQuestView();
});

// 오늘 기록 추가
addTodayButton.addEventListener("click", () => {
  const quest = getCurrentQuest();
  if (!quest) {
    alert("먼저 퀘스트를 선택하거나 만들어 주세요!");
    return;
  }

  const amount = Number(todayAmountInput.value);
  if (!amount || amount <= 0) {
    alert("오늘 한 양을 제대로 입력해 주세요!");
    return;
  }

  const today = getTodayKey();

  // 오늘 날짜 기록이 이미 있으면 더하기
  const existing = quest.records.find(r => r.date === today);
  if (existing) {
    existing.amount += amount;
  } else {
    quest.records.push({
      date: today,
      amount: amount
    });
  }

  todayAmountInput.value = "";

  saveQuestsToStorage();
  updateQuestView();
});


// 7. 시작 시 초기화
loadQuestsFromStorage();
