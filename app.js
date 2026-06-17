const tabButtons = document.querySelectorAll(".tab-button");
const forms = document.querySelectorAll(".calculator-form");
const resultPanels = document.querySelectorAll(".result-panel");
const basicForm = document.querySelector("#basic-form");
const planForm = document.querySelector("#plan-form");
const cashflowForm = document.querySelector("#cashflow-form");

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

const cashFields = {
  startAge: document.querySelector("#cash-start-age"),
  payLength: document.querySelector("#cash-pay-length"),
  holdLength: document.querySelector("#cash-hold-length"),
  withdrawLength: document.querySelector("#cash-withdraw-length"),
  premium: document.querySelector("#cash-premium"),
  income: document.querySelector("#cash-income"),
  rate: document.querySelector("#cash-rate"),
  compoundMethod: document.querySelector("#cash-compound-method"),
  premiumTiming: document.querySelector("#cash-premium-timing"),
  incomeTiming: document.querySelector("#cash-income-timing"),
};

const cashOutput = {
  totalPaid: document.querySelector("#cash-total-paid"),
  startValue: document.querySelector("#cash-start-value"),
  totalIncome: document.querySelector("#cash-total-income"),
  finalValue: document.querySelector("#cash-final-value"),
  formula: document.querySelector("#cash-formula"),
  chart: document.querySelector("#cash-chart"),
  indexLabel: document.querySelector("#cash-index-label"),
  table: document.querySelector("#cash-table"),
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

function toWholeNumber(input, fallback = 0) {
  return Math.max(0, Math.floor(toNumber(input, fallback)));
}

function monthsFromUnit(value, unit) {
  return unit === "year" ? value * 12 : value;
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

function renderCashInvalid(message) {
  cashOutput.totalPaid.textContent = "-";
  cashOutput.startValue.textContent = "-";
  cashOutput.totalIncome.textContent = "-";
  cashOutput.finalValue.textContent = "-";
  cashOutput.formula.textContent = message;
  cashOutput.chart.innerHTML = "";
  cashOutput.table.innerHTML = "";
}

function isUnitEvent(month, startMonth, lengthMonths, unit, timing) {
  if (month < startMonth || month >= startMonth + lengthMonths) {
    return false;
  }

  const offset = month - startMonth;

  if (unit === "month") {
    return true;
  }

  if (timing === "start") {
    return offset % 12 === 0;
  }

  return offset % 12 === 11 || month === startMonth + lengthMonths - 1;
}

function getCashStage(month, payMonths, holdMonths) {
  if (month <= payMonths) {
    return "缴费";
  }

  if (month <= payMonths + holdMonths) {
    return "留存";
  }

  return "领取";
}

function cashRowLabel(month, startAge, tableUnit) {
  if (tableUnit === "year") {
    return startAge + Math.ceil(month / 12);
  }

  const age = startAge + Math.floor((month - 1) / 12);
  const monthInAge = ((month - 1) % 12) + 1;
  return `${age}岁${monthInAge}月`;
}

function shouldSnapshotCash(month, totalMonths, tableUnit) {
  return tableUnit === "month" || month % 12 === 0 || month === totalMonths;
}

function renderCashChart(rows) {
  if (!rows.length) {
    cashOutput.chart.innerHTML = "";
    return;
  }

  const width = 720;
  const height = 260;
  const pad = 34;
  const values = rows.map((row) => row.balance);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(1, ...values);
  const span = maxValue - minValue || 1;

  const points = rows.map((row, index) => {
    const x = rows.length === 1 ? width / 2 : pad + (index / (rows.length - 1)) * (width - pad * 2);
    const y = height - pad - ((row.balance - minValue) / span) * (height - pad * 2);
    return { x, y, row };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const zeroY = height - pad - ((0 - minValue) / span) * (height - pad * 2);
  const first = points[0];
  const last = points[points.length - 1];

  cashOutput.chart.innerHTML = `
    <line x1="${pad}" y1="${zeroY.toFixed(2)}" x2="${width - pad}" y2="${zeroY.toFixed(2)}" class="chart-zero"></line>
    <path d="${path}" class="chart-line"></path>
    <circle cx="${first.x.toFixed(2)}" cy="${first.y.toFixed(2)}" r="4" class="chart-point"></circle>
    <circle cx="${last.x.toFixed(2)}" cy="${last.y.toFixed(2)}" r="5" class="chart-point chart-point-last"></circle>
    <text x="${pad}" y="22" class="chart-label">最高 ${formatMoney(maxValue)}</text>
    <text x="${width - pad}" y="${height - 10}" text-anchor="end" class="chart-label">期末 ${formatMoney(last.row.balance)}</text>
  `;
}

function calculateCashflow() {
  const startAge = toWholeNumber(cashFields.startAge, 30);
  const payLength = toWholeNumber(cashFields.payLength, 10);
  const holdLength = toWholeNumber(cashFields.holdLength, 20);
  const withdrawLength = Math.max(1, toWholeNumber(cashFields.withdrawLength, 20));
  const premium = toNumber(cashFields.premium);
  const income = toNumber(cashFields.income);
  const ratePercent = toNumber(cashFields.rate);
  const payUnit = selectedRadio("cash-pay-unit");
  const holdUnit = selectedRadio("cash-hold-unit");
  const withdrawUnit = selectedRadio("cash-withdraw-unit");
  const premiumUnit = selectedRadio("cash-premium-unit");
  const incomeUnit = selectedRadio("cash-income-unit");
  const rateUnit = selectedRadio("cash-rate-unit");
  const tableUnit = selectedRadio("cash-table-unit");
  const compoundMethod = cashFields.compoundMethod.value;
  const premiumTiming = cashFields.premiumTiming.value;
  const incomeTiming = cashFields.incomeTiming.value;
  const payMonths = monthsFromUnit(payLength, payUnit);
  const holdMonths = monthsFromUnit(holdLength, holdUnit);
  const withdrawMonths = monthsFromUnit(withdrawLength, withdrawUnit);
  const totalMonths = payMonths + holdMonths + withdrawMonths;
  const withdrawStartMonth = payMonths + holdMonths + 1;
  const monthlyRate = compoundMethod === "year"
    ? getNominalMonthlyRate(ratePercent, rateUnit)
    : getMonthlyRate(ratePercent, rateUnit);

  cashFields.startAge.value = startAge;
  cashFields.payLength.value = payLength;
  cashFields.holdLength.value = holdLength;
  cashFields.withdrawLength.value = withdrawLength;
  cashOutput.indexLabel.textContent = tableUnit === "year" ? "年龄" : "年龄/月";

  if (!Number.isFinite(premium) || !Number.isFinite(income)) {
    renderCashInvalid("请输入有效的缴费金额和领取金额。");
    return;
  }

  if (!Number.isFinite(monthlyRate) || monthlyRate <= -1) {
    renderCashInvalid("收益率不能让每月倍率小于或等于 0。");
    return;
  }

  if (totalMonths <= 0) {
    renderCashInvalid("总周期必须大于 0。");
    return;
  }

  let balance = 0;
  let totalPaid = 0;
  let totalIncome = 0;
  let startWithdrawValue = 0;
  let yearAccruedInterest = 0;
  let periodPaid = 0;
  let periodIncome = 0;
  let periodInterest = 0;
  const rows = [];

  for (let month = 1; month <= totalMonths; month += 1) {
    const stage = getCashStage(month, payMonths, holdMonths);
    const premiumDue = isUnitEvent(month, 1, payMonths, premiumUnit, premiumTiming);
    const incomeDue = isUnitEvent(month, withdrawStartMonth, withdrawMonths, incomeUnit, incomeTiming);

    if (premiumDue && premiumTiming === "start") {
      balance += premium;
      totalPaid += premium;
      periodPaid += premium;
    }

    if (incomeDue && incomeTiming === "start") {
      balance -= income;
      totalIncome += income;
      periodIncome += income;
    }

    const interest = balance * monthlyRate;

    if (compoundMethod === "year") {
      yearAccruedInterest += interest;
      periodInterest += interest;

      if (month % 12 === 0 || month === totalMonths) {
        balance += yearAccruedInterest;
        yearAccruedInterest = 0;
      }
    } else {
      balance += interest;
      periodInterest += interest;
    }

    if (premiumDue && premiumTiming === "end") {
      balance += premium;
      totalPaid += premium;
      periodPaid += premium;
    }

    if (incomeDue && incomeTiming === "end") {
      balance -= income;
      totalIncome += income;
      periodIncome += income;
    }

    if (month === payMonths + holdMonths) {
      startWithdrawValue = balance;
    }

    if (shouldSnapshotCash(month, totalMonths, tableUnit)) {
      rows.push({
        label: cashRowLabel(month, startAge, tableUnit),
        stage,
        paid: periodPaid,
        income: periodIncome,
        interest: periodInterest,
        balance,
        totalPaid,
        totalIncome,
      });

      periodPaid = 0;
      periodIncome = 0;
      periodInterest = 0;
    }
  }

  if (payMonths + holdMonths === 0) {
    startWithdrawValue = rows[0]?.balance ?? balance;
  }

  cashOutput.totalPaid.textContent = formatCurrency(totalPaid);
  cashOutput.startValue.textContent = formatCurrency(startWithdrawValue);
  cashOutput.totalIncome.textContent = formatCurrency(totalIncome);
  cashOutput.finalValue.textContent = formatCurrency(balance);
  cashOutput.finalValue.className = balance >= 0 ? "plan-final-positive" : "profit-negative";

  const payText = `${payLength}${payUnit === "year" ? "年" : "个月"}`;
  const holdText = `${holdLength}${holdUnit === "year" ? "年" : "个月"}`;
  const withdrawText = `${withdrawLength}${withdrawUnit === "year" ? "年" : "个月"}`;
  const premiumText = `${premiumUnit === "year" ? "每年" : "每月"}缴费 ${formatCurrency(premium)}（${premiumTiming === "start" ? "期初" : "期末"}）`;
  const incomeText = `${incomeUnit === "year" ? "每年" : "每月"}领取 ${formatCurrency(income)}（${incomeTiming === "start" ? "期初" : "期末"}）`;
  const rateText = `${rateUnit === "year" ? "年收益率" : "月收益率"} = ${formatPercent(ratePercent)}`;
  const compoundText = compoundMethod === "year" ? "年复利：按月累计收益，年底或最后一期结息" : "月复利：每月结息";
  const withdrawAge = startAge + (payMonths + holdMonths) / 12;

  cashOutput.formula.textContent = [
    `总期数（月） = 缴费 ${payMonths} + 留存 ${holdMonths} + 领取 ${withdrawMonths} = ${totalMonths}`,
    `领取开始年龄 = ${withdrawAge.toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 岁`,
    rateText,
    `折算每月计息利率 = ${formatPercent(monthlyRate * 100)}`,
    `缴费期：${premiumText}，持续 ${payText}`,
    `留存期：不缴费不领取，持续 ${holdText}`,
    `领取期：${incomeText}，持续 ${withdrawText}`,
    compoundText,
    `期末现金价值 = 上期现金价值 + 缴费 - 领取 + 当期收益`,
  ].join("\n");

  cashOutput.table.innerHTML = rows.map((row) => {
    const interestClass = row.interest >= 0 ? "profit-positive" : "profit-negative";
    const balanceClass = row.balance >= 0 ? "plan-final-cell" : "profit-negative";

    return `
      <tr>
        <td>${row.label}</td>
        <td>${row.stage}</td>
        <td>${formatMoney(row.paid)}</td>
        <td>${formatMoney(row.income)}</td>
        <td class="${interestClass}">${row.interest >= 0 ? "+" : "-"}${formatMoney(Math.abs(row.interest))}</td>
        <td class="${balanceClass}">${formatMoney(row.balance)}</td>
        <td>${formatMoney(row.totalPaid)}</td>
        <td>${formatMoney(row.totalIncome)}</td>
      </tr>
    `;
  }).join("");

  renderCashChart(rows);
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

cashflowForm.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateCashflow();
});

cashflowForm.querySelectorAll("input, select").forEach((field) => {
  field.addEventListener("input", calculateCashflow);
  field.addEventListener("change", calculateCashflow);
});

document.querySelectorAll('input[name="contribution-unit"]').forEach((radio) => {
  radio.addEventListener("change", calculatePlan);
});

calculateBasic();
calculatePlan();
calculateCashflow();
