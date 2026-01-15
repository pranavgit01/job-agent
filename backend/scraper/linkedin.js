cat > backend/scraper/linkedin.js << 'EOF'
const puppeteer = require('puppeteer');

async function scrapeLinkedIn(profile) {
  console.log('🔍 Starting LinkedIn scrape...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const searchQuery = profile.target_roles?.split(',')[0]?.trim() || 'Software Engineer';
    const location = profile.preferred_locations?.split(',')[0]?.trim() || 'United States';
    
    const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`;
    
    console.log('📍 Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.waitForSelector('.jobs-search__results-list', { timeout: 10000 });
    
    const jobs = await page.evaluate(() => {
      const jobCards = document.querySelectorAll('.base-card');
      const results = [];
      
      jobCards.forEach((card, index) => {
        const titleEl = card.querySelector('.base-search-card__title');
        const companyEl = card.querySelector('.base-search-card__subtitle');
        const locationEl = card.querySelector('.job-search-card__location');
        const linkEl = card.querySelector('a.base-card__full-link');
        
        if (titleEl && companyEl) {
          results.push({
            id: `linkedin-${Date.now()}-${index}`,
            title: titleEl.textContent.trim(),
            company: companyEl.textContent.trim(),
            location: locationEl?.textContent.trim() || 'Not specified',
            salary: 'Not disclosed',
            type: 'Full-time',
            description: 'View on LinkedIn for full details',
            requirements: [],
            url: linkEl?.href || '',
            source: 'LinkedIn',
            postedDate: new Date()
          });
        }
      });
      
      return results;
    });
    
    console.log(`✅ Scraped ${jobs.length} jobs from LinkedIn`);
    return jobs.slice(0, 20);
    
  } catch (error) {
    console.error('❌ LinkedIn scraping error:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeLinkedIn };
EOF