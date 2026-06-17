const tabButtons = document.querySelectorAll(".tab-button");
const forms = document.querySelectorAll(".calculator-form");
const resultPanels = document.querySelectorAll(".result-panel");
const basicForm = document.querySelector("#basic-form");
const planForm = document.querySelector("#plan-form");

const basicFields = {
  principal: document.querySelector("#principal"),
  rate: document.querySelector("#rate"),
  periods: document.querySelector("#periods"),
  rateUnit: document.querySelector("#rate-unit"),
  compoundFrequency: document.querySelector("#compound-frequency"),
};

const basicOutput = {
  finalAmount: document.querySelector("#final-amount"),
  totalProfit: document.querySelector("#total-profit"),
  totalReturn: document.querySelector("#total-return"),
  formulaText: document.querySelector("#formula-text"),
  periodTable: document.querySelector("#period-table"),
};

const planFields = {
  principal: document.querySelector("#plan-principal"),
  monthlyContribution: document.querySelector("#monthly-contribution"),
  termLength: document.querySelector("#term-length"),
  yieldRate: document.querySelector("#yield-rate"),
  compoundMethod: document.querySelector("#plan-compound-method"),
};

const planOutput = {
  profit: document.querySelector("#plan-profit"),
  final: document.querySelector("#plan-final"),
  invested: document.querySelector("#plan-invested"),
  formula: document.querySelector("#plan-formula"),
  indexLabel: document.querySelector("#plan-index-label"),
  table: document.querySelector("#plan-table"),
};

const periodFactors = {
  year: 1,
  month: 12,
  day: 365,
  period: 1,
};

const labels = {
  year: "年",
  month: "月",
  day: "日",
  period: "期",
};

function toNumber(input, fallback = 0) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function selectedRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function formatMoney(value) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrency(value) {
  return `${value < 0 ? "-" : ""}¥${formatMoney(Math.abs(value))}`;
}

function formatPercent(value) {
  return `${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function setSignedText(element, value, unit = "¥") {
  const sign = value >= 0 ? "+" : "-";
  element.textContent = `${sign}${unit}${formatMoney(Math.abs(value))}`;
  element.className = value >= 0 ? "profit-positive" : "profit-negative";
}

function getEffectiveRate(ratePercent, rateUnit, compoundFrequency) {
  const baseRate = ratePercent / 100;

  if (rateUnit === compoundFrequency || rateUnit === "period" || compoundFrequency === "period") {
    return baseRate;
  }

  const sourcePeriods = periodFactors[rateUnit];
  const targetPeriods = periodFactors[compoundFrequency];
  return Math.pow(1 + baseRate, sourcePeriods / targetPeriods) - 1;
}

function getMonthlyRate(ratePercent, yieldUnit) {
  const baseRate = ratePercent / 100;
  return yieldUnit === "year" ? Math.pow(1 + baseRate, 1 / 12) - 1 : baseRate;
}

function getNominalMonthlyRate(ratePercent, yieldUnit) {
  const baseRate = ratePercent / 100;
  return yieldUnit === "year" ? baseRate / 12 : baseRate;
}

function setActiveTab(tabName) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  forms.forEach((form) => form.classList.toggle("active", form.dataset.panel === tabName));
  resultPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.result === tabName));
}

function renderBasicInvalid(message) {
  basicOutput.finalAmount.textContent = "-";
  basicOutput.totalProfit.textContent = "-";
  basicOutput.totalProfit.className = "";
  basicOutput.totalReturn.textContent = "-";
  basicOutput.totalReturn.className = "";
  basicOutput.formulaText.textContent = message;
  basicOutput.periodTable.innerHTML = "";
}

function calculateBasic() {
  const principal = Math.max(0, toNumber(basicFields.principal));
  const ratePercent = toNumber(basicFields.rate);
  const periods = Math.max(1, Math.floor(toNumber(basicFields.periods, 1)));
  const rateUnit = basicFields.rateUnit.value;
  const compoundFrequency = basicFields.compoundFrequency.value;
  const effectiveRate = getEffectiveRate(ratePercent, rateUnit, compoundFrequency);

  basicFields.periods.value = periods;

  if (principal <= 0) {
    renderBasicInvalid("请输入大于 0 的本金。");
    return;
  }

  if (!Number.isFinite(effectiveRate) || effectiveRate <= -1) {
    renderBasicInvalid("利率不能让每期倍率小于或等于 0。");
    return;
  }

  const finalAmount = principal * Math.pow(1 + effectiveRate, periods);
  const totalProfit = finalAmount - principal;
  const totalReturn = (totalProfit / principal) * 100;

  basicOutput.finalAmount.textContent = formatCurrency(finalAmount);
  setSignedText(basicOutput.totalProfit, totalProfit);
  basicOutput.totalReturn.textContent = formatPercent(totalReturn);
  basicOutput.totalReturn.className = totalReturn >= 0 ? "profit-positive" : "profit-negative";

  const unitText = labels[compoundFrequency];
  basicOutput.formulaText.textContent = [
    `单${unitText}有效利率 = ${formatPercent(effectiveRate * 100)}`,
    `最终金额 = 本金 × (1 + 单${unitText}有效利率) ^ 期数`,
    `代入 = ${formatMoney(principal)} × (1 + ${effectiveRate.toFixed(8)}) ^ ${periods}`,
    `结果 = ${formatMoney(finalAmount)}`,
  ].join("\n");

  const rows = [];
  let previousAmount = principal;

  for (let period = 1; period <= periods; period += 1) {
    const amount = principal * Math.pow(1 + effectiveRate, period);
    const profit = amount - previousAmount;
    const returnRate = ((amount - principal) / principal) * 100;
    const profitClass = profit >= 0 ? "profit-positive" : "profit-negative";
    const profitSign = profit >= 0 ? "+" : "-";

    rows.push(`
      <tr>
        <td>${period}</td>
        <td class="${profitClass}">${profitSign}${formatMoney(Math.abs(profit))}</td>
        <td>${formatMoney(amount)}</td>
        <td>${formatPercent(returnRate)}</td>
      </tr>
    `);

    previousAmount = amount;
  }

  basicOutput.periodTable.innerHTML = rows.join("");
}

function renderPlanInvalid(message) {
  planOutput.profit.textContent = "-";
  planOutput.profit.className = "";
  planOutput.final.textContent = "-";
  planOutput.invested.textContent = "-";
  planOutput.formula.textContent = message;
  planOutput.table.innerHTML = "";
}

function snapshotPlan(rows, month, totalMonths, tableUnit, periodPrincipal, periodProfit, balance) {
  if (tableUnit === "month" || month % 12 === 0 || month === totalMonths) {
    rows.push({
      index: tableUnit === "month" ? month : month / 12,
      principal: periodPrincipal,
      profit: periodProfit,
      balance,
    });
  }
}

function calculatePlan() {
  const initialPrincipal = toNumber(planFields.principal);
  const contribution = toNumber(planFields.monthlyContribution);
  const contributionUnit = selectedRadio("contribution-unit");
  const termLength = Math.max(1, Math.floor(toNumber(planFields.termLength, 1)));
  const termUnit = selectedRadio("term-unit");
  const yieldRate = toNumber(planFields.yieldRate);
  const yieldUnit = selectedRadio("yield-unit");
  const compoundMethod = planFields.compoundMethod.value;
  const tableUnit = selectedRadio("plan-table-unit");
  const totalMonths = termUnit === "year" ? termLength * 12 : termLength;

  planFields.termLength.value = termLength;
  planOutput.indexLabel.textContent = tableUnit === "year" ? "年" : "月";

  if (!Number.isFinite(initialPrincipal) || !Number.isFinite(contribution)) {
    renderPlanInvalid("请输入有效的初始本金和定投金额。");
    return;
  }

  let balance = initialPrincipal;
  let totalInvested = initialPrincipal;
  let yearAccruedInterest = 0;
  let periodPrincipal = initialPrincipal;
  let periodProfit = 0;
  const rows = [];
  const monthlyRate = compoundMethod === "year"
    ? getNominalMonthlyRate(yieldRate, yieldUnit)
    : getMonthlyRate(yieldRate, yieldUnit);

  if (!Number.isFinite(monthlyRate) || monthlyRate <= -1) {
    renderPlanInvalid("收益率不能让每月倍率小于或等于 0。");
    return;
  }

  for (let month = 1; month <= totalMonths; month += 1) {
    const shouldContribute = contributionUnit === "month"
      ? month > 1
      : month > 12 && month % 12 === 1;

    if (shouldContribute) {
      balance += contribution;
      totalInvested += contribution;
      periodPrincipal += contribution;
    }

    if (compoundMethod === "year") {
      const interest = balance * monthlyRate;
      yearAccruedInterest += interest;
      periodProfit += interest;

      if (month % 12 === 0 || month === totalMonths) {
        balance += yearAccruedInterest;
        yearAccruedInterest = 0;
      }
    } else {
      const interest = balance * monthlyRate;
      balance += interest;
      periodProfit += interest;
    }

    snapshotPlan(rows, month, totalMonths, tableUnit, periodPrincipal, periodProfit, balance);

    if (tableUnit === "year" && month % 12 === 0) {
      periodPrincipal = balance;
      periodProfit = 0;
    }
  }

  const totalProfit = balance - totalInvested;

  setSignedText(planOutput.profit, totalProfit);
  planOutput.final.textContent = formatCurrency(balance);
  planOutput.final.className = totalProfit >= 0 ? "plan-final-positive" : "profit-negative";
  planOutput.invested.textContent = formatCurrency(totalInvested);

  const contributionText = contribution < 0 ? "定期取出" : "定期投入";
  const contributionUnitText = contributionUnit === "month" ? "每月" : "每年";
  const contributionStartText = contributionUnit === "month" ? "第 2 个月" : "第 2 年";
  const displayTermLine = contributionUnit === "year" && termUnit === "year"
    ? `总期数（年） = ${termLength}`
    : `总期数（月） = ${totalMonths}`;
  const displayRateLine = contributionUnit === "year" && yieldUnit === "year"
    ? `年利率 = ${formatPercent(yieldRate)}`
    : `每月利率 = ${formatPercent(monthlyRate * 100)}`;
  const methodText = compoundMethod === "year" ? "年复利：每月按比例累计利息，年底或最后一期结息" : "月复利：每月先定投/定取，再结息";
  const formulaLines = [
    displayTermLine,
    displayRateLine,
    `${contributionUnitText}${contributionText} = ${formatCurrency(contribution)}，从${contributionStartText}开始执行`,
  ];

  if (displayRateLine.startsWith("年利率")) {
    formulaLines.push(`折算每月计息利率 = ${formatPercent(monthlyRate * 100)}`);
  }

  formulaLines.push(
    methodText,
    `总收益 = 最终金额 - 总投资额 = ${formatMoney(balance)} - ${formatMoney(totalInvested)} = ${formatMoney(totalProfit)}`,
  );

  planOutput.formula.textContent = formulaLines.join("\n");

  planOutput.table.innerHTML = rows.map((row) => {
    const profitClass = row.profit >= 0 ? "profit-positive" : "profit-negative";
    const profitSign = row.profit >= 0 ? "+" : "-";

    return `
      <tr>
        <td>${row.index}</td>
        <td>${formatMoney(row.principal)}</td>
        <td class="${profitClass}">${profitSign}${formatMoney(Math.abs(row.profit))}</td>
        <td class="plan-final-cell">${formatMoney(row.balance)}</td>
      </tr>
    `;
  }).join("");
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

basicForm.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateBasic();
});

planForm.addEventListener("submit", (event) => {
  event.preventDefault();
  calculatePlan();
});

document.querySelectorAll('input[name="contribution-unit"]').forEach((radio) => {
  radio.addEventListener("change", calculatePlan);
});

calculateBasic();
calculatePlan();
