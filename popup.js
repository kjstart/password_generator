const DEFAULT_SETTINGS = {
  letters: true,
  numbers: true,
  symbols: true,
  extendedSymbols: false,
  length: 16
};

const STORAGE_KEY = "passwordGeneratorSettings";
const CHARSETS = {
  letters: "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
  numbers: "23456789",
  symbols: "-_.~+=",
  extendedSymbols: "@%&?;|<>[]{}()*!"
};
const MESSAGES = {
  en: {
    title: "Password Generator",
    heading: "Password Generator",
    appLabel: "Password Generator",
    passwordRowLabel: "Generated password",
    passwordInputLabel: "Password",
    optionsLabel: "Password options",
    lengthRowLabel: "Password length",
    regenerateLabel: "Regenerate password",
    copyLabel: "Copy password",
    letters: "Letters",
    numbers: "Numbers",
    symbols: "Symbols",
    extendedSymbols: "Complex Symbols",
    length: "Length",
    selectOne: "Select at least one character type",
    copied: "Copied",
    copyFailed: "Copy failed",
    nothingToCopy: "No password to copy"
  },
  zh: {
    title: "密码生成器",
    heading: "密码生成器",
    appLabel: "密码生成器",
    passwordRowLabel: "生成的密码",
    passwordInputLabel: "密码",
    optionsLabel: "密码选项",
    lengthRowLabel: "密码长度",
    regenerateLabel: "重新生成密码",
    copyLabel: "复制密码",
    letters: "字母",
    numbers: "数字",
    symbols: "符号",
    extendedSymbols: "复杂符号",
    length: "长度",
    selectOne: "至少选择一种字符",
    copied: "已复制",
    copyFailed: "复制失败",
    nothingToCopy: "没有可复制的密码"
  }
};

const app = document.querySelector("#app");
const passwordRow = document.querySelector("#passwordRow");
const passwordInput = document.querySelector("#password");
const regenerateButton = document.querySelector("#regenerate");
const copyButton = document.querySelector("#copy");
const options = document.querySelector("#options");
const statusEl = document.querySelector("#status");
const lengthRow = document.querySelector("#lengthRow");
const lengthSlider = document.querySelector("#length");
const lengthValue = document.querySelector("#lengthValue");
const checkboxes = {
  letters: document.querySelector("#letters"),
  numbers: document.querySelector("#numbers"),
  symbols: document.querySelector("#symbols"),
  extendedSymbols: document.querySelector("#extendedSymbols")
};

let statusTimer = null;
let messages = MESSAGES.en;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  messages = getMessages();
  applyLanguage();

  const settings = await loadSettings();
  applySettings(settings);
  generateAndRenderPassword();

  Object.values(checkboxes).forEach((checkbox) => {
    checkbox.addEventListener("change", handleOptionChange);
  });

  lengthSlider.addEventListener("input", handleOptionChange);
  regenerateButton.addEventListener("click", generateAndRenderPassword);
  copyButton.addEventListener("click", copyPassword);
}

async function loadSettings() {
  const saved = await chrome.storage.local.get(STORAGE_KEY);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(saved[STORAGE_KEY] || {})
  };

  settings.length = clampLength(settings.length);

  if (!hasSelectedType(settings)) {
    return { ...DEFAULT_SETTINGS };
  }

  return settings;
}

function applySettings(settings) {
  checkboxes.letters.checked = settings.letters;
  checkboxes.numbers.checked = settings.numbers;
  checkboxes.symbols.checked = settings.symbols;
  checkboxes.extendedSymbols.checked = settings.extendedSymbols;
  lengthSlider.value = settings.length;
  lengthValue.value = settings.length;
  lengthValue.textContent = settings.length;
}

function readSettings() {
  return {
    letters: checkboxes.letters.checked,
    numbers: checkboxes.numbers.checked,
    symbols: checkboxes.symbols.checked,
    extendedSymbols: checkboxes.extendedSymbols.checked,
    length: clampLength(lengthSlider.value)
  };
}

async function handleOptionChange(event) {
  const settings = readSettings();

  if (!hasSelectedType(settings) && event.target.type === "checkbox") {
    event.target.checked = true;
    showStatus(messages.selectOne);
    return;
  }

  lengthValue.value = settings.length;
  lengthValue.textContent = settings.length;

  await chrome.storage.local.set({ [STORAGE_KEY]: readSettings() });
  generateAndRenderPassword();
}

function generateAndRenderPassword() {
  const settings = readSettings();
  passwordInput.value = generatePassword(settings);
  passwordInput.focus();
  passwordInput.select();
}

function generatePassword(settings) {
  const selectedSets = Object.entries(CHARSETS)
    .filter(([key]) => settings[key])
    .map(([key, chars]) => ({ key, chars }));
  const missingTypes = new Set(selectedSets.map(({ key }) => key));
  const password = [];

  for (let position = 0; position < settings.length; position += 1) {
    const remainingSlots = settings.length - position;
    const previousChar = password[position - 1] || "";
    const eligibleSets =
      missingTypes.size === remainingSlots
        ? selectedSets.filter(({ key }) => missingTypes.has(key))
        : selectedSets;
    const next = pickFromCharacterPool(eligibleSets, previousChar);

    password.push(next.char);
    missingTypes.delete(next.key);
  }

  return password.join("");
}

function secureRandomInt(max) {
  const array = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let value = 0;

  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);

  return value % max;
}

function pickFromCharacterPool(sets, previousChar) {
  const pool = buildCharacterPool(sets, previousChar);

  return pool[secureRandomInt(pool.length)];
}

function buildCharacterPool(sets, previousChar) {
  const pool = [];

  sets.forEach(({ key, chars }) => {
    for (const char of chars) {
      if (char !== previousChar) {
        pool.push({ key, char });
      }
    }
  });

  return pool;
}

async function copyPassword() {
  const password = passwordInput.value;

  if (!password) {
    showStatus(messages.nothingToCopy);
    return;
  }

  try {
    await navigator.clipboard.writeText(password);
    showStatus(messages.copied);
  } catch {
    passwordInput.select();
    const didCopy = document.execCommand("copy");
    showStatus(didCopy ? messages.copied : messages.copyFailed);
  }
}

function getMessages() {
  const language =
    globalThis.chrome?.i18n?.getUILanguage?.() ||
    navigator.language ||
    navigator.userLanguage ||
    "en";

  if (language.toLowerCase().startsWith("zh")) {
    return MESSAGES.zh;
  }

  return MESSAGES.en;
}

function applyLanguage() {
  const isChinese = messages === MESSAGES.zh;

  document.documentElement.lang = isChinese ? "zh-CN" : "en";
  document.title = messages.title;
  app.setAttribute("aria-label", messages.appLabel);
  passwordRow.setAttribute("aria-label", messages.passwordRowLabel);
  passwordInput.setAttribute("aria-label", messages.passwordInputLabel);
  options.setAttribute("aria-label", messages.optionsLabel);
  lengthRow.setAttribute("aria-label", messages.lengthRowLabel);
  regenerateButton.setAttribute("aria-label", messages.regenerateLabel);
  regenerateButton.title = messages.regenerateLabel;
  copyButton.setAttribute("aria-label", messages.copyLabel);
  copyButton.title = messages.copyLabel;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = messages[key];
  });
}

function hasSelectedType(settings) {
  return settings.letters || settings.numbers || settings.symbols || settings.extendedSymbols;
}

function clampLength(value) {
  const number = Number.parseInt(value, 10);

  if (Number.isNaN(number)) {
    return DEFAULT_SETTINGS.length;
  }

  return Math.min(64, Math.max(6, number));
}

function showStatus(message) {
  window.clearTimeout(statusTimer);
  statusEl.textContent = message;
  statusTimer = window.setTimeout(() => {
    statusEl.textContent = "";
  }, 1600);
}
