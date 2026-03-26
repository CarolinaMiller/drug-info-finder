const searchBtn = document.getElementById('searchBtn');
const drugInput = document.getElementById('drugInput');
const results = document.getElementById('results');
const loader = document.getElementById('loader');
const error = document.getElementById('error');
const historySection = document.getElementById('history-section');
const historyTags = document.getElementById('history-tags');

let searchHistory = [];

function showError(msg) {
  error.textContent = msg;
  error.classList.remove('hidden');
}

function hideError() {
  error.classList.add('hidden');
}

function showLoader() {
  loader.classList.remove('hidden');
}

function hideLoader() {
  loader.classList.add('hidden');
}

function truncate(text, maxLength = 300) {
  if (!text) return 'Not available';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function addToHistory(drugName) {
  if (!searchHistory.includes(drugName)) {
    searchHistory.unshift(drugName);
    if (searchHistory.length > 5) searchHistory.pop();
  }
  renderHistory();
}

function renderHistory() {
  if (searchHistory.length === 0) {
    historySection.classList.add('hidden');
    return;
  }
  historySection.classList.remove('hidden');
  historyTags.innerHTML = '';
  searchHistory.forEach(name => {
    const tag = document.createElement('span');
    tag.classList.add('history-tag');
    tag.textContent = name;
    tag.addEventListener('click', () => {
      drugInput.value = name;
      searchDrug();
    });
    historyTags.appendChild(tag);
  });
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy generic name';
      btn.classList.remove('copied');
    }, 2000);
  });
}

async function searchDrug() {
  const drugName = drugInput.value.trim();

  if (!drugName) {
    showError('Please enter a drug name.');
    return;
  }

  hideError();
  results.innerHTML = '';
  showLoader();

  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${drugName}"&limit=3`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Drug not found. Try a different name.');
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error('No results found. Try a different name.');
    }

    addToHistory(drugName);

    data.results.forEach(drug => {
      const brandName = drug.openfda?.brand_name?.[0] || drugName;
      const genericName = drug.openfda?.generic_name?.[0] || 'Not available';
      const purpose = drug.purpose?.[0] || drug.indications_and_usage?.[0] || 'Not available';
      const warnings = drug.warnings?.[0] || drug.warnings_and_cautions?.[0] || 'Not available';
      const adverse = drug.adverse_reactions?.[0] || 'Not available';

      const card = document.createElement('div');
      card.classList.add('drug-card');

      card.innerHTML = `
        <div class="drug-card-header">
          <h2>${brandName}</h2>
          <button class="copy-btn">Copy generic name</button>
        </div>
        <div class="section">
          <div class="section-title">Generic name</div>
          <div class="section-content">${genericName}</div>
        </div>
        <div class="section">
          <div class="section-title">Purpose / Indications</div>
          <div class="section-content">${truncate(purpose)}</div>
        </div>
        <div class="section">
          <div class="section-title">Warnings</div>
          <div class="section-content">${truncate(warnings)}</div>
        </div>
        <div class="section">
          <div class="section-title">Adverse reactions</div>
          <div class="section-content">${truncate(adverse)}</div>
        </div>
      `;

      const copyBtn = card.querySelector('.copy-btn');
      copyBtn.addEventListener('click', () => copyToClipboard(genericName, copyBtn));

      results.appendChild(card);
    });

  } catch (err) {
    showError(err.message || 'Something went wrong. Please try again.');
  } finally {
    hideLoader();
  }
}

searchBtn.addEventListener('click', searchDrug);

drugInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') searchDrug();
});