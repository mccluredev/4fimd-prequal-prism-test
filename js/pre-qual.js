document.addEventListener("DOMContentLoaded", () => {
  const steps = Array.from(document.querySelectorAll(".step"));

  // Build section metadata for completion tracking
  const sectionMeta = {};
  steps.forEach((step, index) => {
    const sec = step.dataset.section;
    if (!sectionMeta[sec]) {
      sectionMeta[sec] = { min: index, max: index };
    } else {
      sectionMeta[sec].max = index;
    }
  });

  let currentIndex = 0;
  let furthestIndex = 0;

  const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

  function formatCurrency(value) {
    const num = Number(value || 0);
    return "$" + formatter.format(num);
  }

  function setSummary(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "—";
  }

  /* ==========================
     Navigation
  ========================== */
  function goToStep(id) {
    const target = document.getElementById(id);
    if (!target) return;

    steps.forEach((step) => step.classList.remove("active"));
    target.classList.add("active");

    currentIndex = steps.indexOf(target);
    furthestIndex = Math.max(furthestIndex, currentIndex);

    updateSidebar();
    updateProgress();
  }

  document.querySelectorAll(".btn-next").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.next;
      if (!next) return;

      if (next === "complete") {
        // Placeholder: later hook into Salesforce + estimate
        window.location.href = "complete/index.html";
        return;
      }

      goToStep(next);
    });
  });

  document.querySelectorAll(".btn-prev").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prev = btn.dataset.prev;
      if (prev) goToStep(prev);
    });
  });

  /* ==========================
     Sidebar highlighting + completion
  ========================== */
  function updateSidebar() {
    const activeSection = steps[currentIndex].dataset.section;
    document.querySelectorAll(".section-pill").forEach((pill) => {
      const sec = pill.dataset.section;
      const meta = sectionMeta[sec];

      pill.classList.toggle("active", sec === activeSection);

      // A section is "complete" if all of its steps are at or before furthestIndex
      const isComplete =
        meta && meta.max <= furthestIndex && sec !== activeSection;
      pill.classList.toggle("complete", isComplete);
    });
  }

  /* ==========================
     Progress Dial
  ========================== */
  const totalSteps = steps.length;
  const dial = document.querySelector(".dial-progress");
  const label = document.getElementById("progress-label");
  const circumference = 339;

  function updateProgress() {
    const pct = Math.round(((currentIndex + 1) / totalSteps) * 100);
    const offset = circumference - (pct / 100) * circumference;
    dial.style.strokeDashoffset = offset;
    label.textContent = `${pct}%`;
  }

  updateProgress();
  updateSidebar();

  /* ==========================
     Prefill Loan Amount from ?amount=
  ========================== */
  const loanInput = document.getElementById("loan-amount-input");
  const params = new URLSearchParams(window.location.search);
  const amountParam = params.get("amount");

  if (loanInput) {
    if (amountParam) {
      const clean = amountParam.replace(/[^\d]/g, "");
      loanInput.value = formatter.format(clean);
      setSummary("summary-loan-amount", formatCurrency(clean));
    }

    loanInput.addEventListener("input", () => {
      let raw = loanInput.value.replace(/[^\d]/g, "");
      if (!raw) {
        loanInput.value = "";
        setSummary("summary-loan-amount", "—");
        return;
      }
      loanInput.value = formatter.format(raw);
      setSummary("summary-loan-amount", formatCurrency(raw));
    });
  }

  /* ==========================
     Map radio groups to summary
  ========================== */
  function mapRadioGroup(name, summaryId) {
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    if (!radios.length) return;

    radios.forEach((radio) => {
      radio.addEventListener("change", () => {
        const selected = Array.from(radios).find((r) => r.checked);
        setSummary(summaryId, selected ? selected.value : "—");
      });
    });
  }

  mapRadioGroup("loan-purpose", "summary-loan-purpose");
  mapRadioGroup("credit-score", "summary-credit-score");
  mapRadioGroup("employment-structure", "summary-employment");

  /* ==========================
     Sliders (Income & Debt)
  ========================== */
  const incomeSlider = document.getElementById("income-input");
  const incomeDisplay = document.getElementById("income-display");

  if (incomeSlider && incomeDisplay) {
    const updateIncome = () => {
      const val = Number(incomeSlider.value || 0);
      const text = val >= 100000 ? "$100K+" : formatCurrency(val);
      incomeDisplay.textContent = text;
      setSummary("summary-income", text);
    };
    incomeSlider.addEventListener("input", updateIncome);
    updateIncome();
  }

  const debtSlider = document.getElementById("debt-input");
  const debtDisplay = document.getElementById("debt-display");

  if (debtSlider && debtDisplay) {
    const updateDebt = () => {
      const val = Number(debtSlider.value || 0);
      const text = val >= 50000 ? "$50K+" : formatCurrency(val);
      debtDisplay.textContent = text;
      setSummary("summary-debt", text);
    };
    debtSlider.addEventListener("input", updateDebt);
    updateDebt();
  }

  /* ==========================
     Insurance checkbox summary
  ========================== */
  const insuranceGroup = document.getElementById("insurance-group");
  if (insuranceGroup) {
    insuranceGroup.addEventListener("change", () => {
      const selected = Array.from(
        insuranceGroup.querySelectorAll('input[type="checkbox"]:checked')
      ).map((c) => c.value);
      setSummary("summary-insurance", selected.join(", ") || "—");
    });
  }
});
