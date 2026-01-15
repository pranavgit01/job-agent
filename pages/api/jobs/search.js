import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetRoles, preferredLocations, skills, companies } = req.body;

  try {
    // Scrape from LinkedIn, Indeed, Glassdoor, and company career pages
    const jobs = await scrapeJobs(targetRoles, preferredLocations, skills, companies);
    
    res.status(200).json({ jobs, count: jobs.length });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs', message: error.message });
  }
}

async function scrapeJobs(roles, locations, skills, companies) {
  const allJobs = [];
  
  // Use JSearch API - aggregates from LinkedIn, Indeed, Glassdoor, ZipRecruiter
  try {
    const jsearchJobs = await fetchFromJSearch(roles, locations);
    allJobs.push(...jsearchJobs);
  } catch (error) {
    console.log('JSearch API error:', error.message);
  }

  // Use SerpAPI for Google Jobs (indexes Indeed, LinkedIn, Glassdoor)
  try {
    const googleJobs = await fetchFromGoogleJobs(roles, locations);
    allJobs.push(...googleJobs);
  } catch (error) {
    console.log('Google Jobs error:', error.message);
  }

  // Use LinkedIn API via RapidAPI
  try {
    const linkedinJobs = await fetchFromLinkedIn(roles, locations);
    allJobs.push(...linkedinJobs);
  } catch (error) {
    console.log('LinkedIn API error:', error.message);
  }

  // Scrape company career pages if companies provided
  if (companies && companies.length > 0) {
    try {
      const companyJobs = await scrapeCompanyPages(companies, roles);
      allJobs.push(...companyJobs);
    } catch (error) {
      console.log('Company pages error:', error.message);
    }
  }

  // Remove duplicates based on title and company
  const uniqueJobs = Array.from(
    new Map(allJobs.map(job => [`${job.title}-${job.company}`, job])).values()
  );

  // Calculate match scores based on skills
  return uniqueJobs.map(job => ({
    ...job,
    matchScore: calculateMatchScore(job, skills)
  })).sort((a, b) => b.matchScore - a.matchScore);
}

// LinkedIn Jobs via RapidAPI
async function fetchFromLinkedIn(roles, locations) {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  
  if (!RAPIDAPI_KEY) {
    console.log('RapidAPI key not configured for LinkedIn');
    return [];
  }

  try {
    const roleKeyword = roles.split(',')[0].trim();
    const location = locations?.split(',')[0]?.trim() || '';
    
    const url = `https://linkedin-data-api.p.rapidapi.com/search-jobs`;
    const response = await axios.post(url, {
      keywords: roleKeyword,
      locationId: location,
      datePosted: 'anyTime',
      sort: 'mostRelevant'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'linkedin-data-api.p.rapidapi.com'
      },
      timeout: 15000
    });
    
    if (!response.data || !response.data.data) {
      return [];
    }

    return response.data.data.slice(0, 20).map(job => ({
      id: `linkedin-${job.id || Math.random()}`,
      title: job.title,
      company: job.company || 'Company',
      location: job.location || location || 'Remote',
      salary: job.salary || 'Competitive',
      type: job.type || 'Full-time',
      description: job.description?.slice(0, 300) || '',
      requirements: job.skills || [],
      postedDays: calculateDaysAgo(job.postedAt),
      applyUrl: job.url || `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(roleKeyword)}`,
      source: 'LinkedIn'
    }));
  } catch (error) {
    console.error('LinkedIn API error:', error.message);
    return [];
  }
}

// Google Jobs via SerpAPI (aggregates Indeed, LinkedIn, Glassdoor)
async function fetchFromGoogleJobs(roles, locations) {
  const SERPAPI_KEY = process.env.SERPAPI_KEY;
  
  if (!SERPAPI_KEY) {
    console.log('SerpAPI key not configured');
    return [];
  }

  try {
    const roleKeyword = roles.split(',')[0].trim();
    const location = locations?.split(',')[0]?.trim() || 'United States';
    
    const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(roleKeyword)}&location=${encodeURIComponent(location)}&api_key=${SERPAPI_KEY}`;
    const response = await axios.get(url, { timeout: 15000 });
    
    if (!response.data || !response.data.jobs_results) {
      return [];
    }

    return response.data.jobs_results.slice(0, 20).map(job => {
      // Determine source from the apply link
      let source = 'Indeed'; // Default
      if (job.via?.toLowerCase().includes('linkedin')) source = 'LinkedIn';
      else if (job.via?.toLowerCase().includes('glassdoor')) source = 'Glassdoor';
      else if (job.via?.toLowerCase().includes('indeed')) source = 'Indeed';
      
      return {
        id: `google-${job.job_id || Math.random()}`,
        title: job.title,
        company: job.company_name || 'Company',
        location: job.location || location,
        salary: job.detected_extensions?.salary || 'Competitive',
        type: job.detected_extensions?.work_from_home ? 'Remote' : 'Full-time',
        description: job.description?.slice(0, 300) || '',
        requirements: job.job_highlights?.Qualifications || [],
        postedDays: calculateDaysAgo(job.detected_extensions?.posted_at),
        applyUrl: job.apply_options?.[0]?.link || job.share_link || '#',
        source: source
      };
    });
  } catch (error) {
    console.error('Google Jobs API error:', error.message);
    return [];
  }
}

// JSearch API - Aggregates from Indeed, LinkedIn, Glassdoor, ZipRecruiter
async function fetchFromJSearch(roles, locations) {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  
  if (!RAPIDAPI_KEY) {
    console.log('RapidAPI key not configured for JSearch');
    return [];
  }

  try {
    const roleKeyword = roles.split(',')[0].trim();
    const location = locations?.split(',')[0]?.trim() || 'Remote';
    
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(roleKeyword + ' ' + location)}&page=1&num_pages=2`;
    const response = await axios.get(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      },
      timeout: 15000
    });
    
    if (!response.data || !response.data.data) {
      return [];
    }

    return response.data.data.slice(0, 30).map(job => {
      // Detect source from apply link
      let source = 'Indeed';
      const applyLink = job.job_apply_link?.toLowerCase() || '';
      if (applyLink.includes('linkedin')) source = 'LinkedIn';
      else if (applyLink.includes('glassdoor')) source = 'Glassdoor';
      else if (applyLink.includes('indeed')) source = 'Indeed';
      else if (job.employer_website) source = job.employer_name;
      
      return {
        id: `jsearch-${job.job_id}`,
        title: job.job_title,
        company: job.employer_name || 'Company',
        location: job.job_city && job.job_state 
          ? `${job.job_city}, ${job.job_state}` 
          : job.job_country || 'Remote',
        salary: formatSalary(job.job_min_salary, job.job_max_salary) || 'Competitive',
        type: job.job_employment_type || 'Full-time',
        description: job.job_description?.slice(0, 300) || '',
        requirements: job.job_highlights?.Qualifications?.slice(0, 5) || [],
        postedDays: calculateDaysAgo(job.job_posted_at_datetime_utc),
        applyUrl: job.job_apply_link || job.job_google_link || '#',
        source: source
      };
    });
  } catch (error) {
    console.error('JSearch API error:', error.message);
    return [];
  }
}

// Scrape company career pages
async function scrapeCompanyPages(companies, roles) {
  const jobs = [];
  const roleKeyword = roles.split(',')[0].trim().toLowerCase();
  
  for (const company of companies.slice(0, 5)) { // Limit to 5 companies
    try {
      const careerUrls = [
        `https://${company.toLowerCase().replace(/\s+/g, '')}.com/careers`,
        `https://www.${company.toLowerCase().replace(/\s+/g, '')}.com/careers`,
        `https://careers.${company.toLowerCase().replace(/\s+/g, '')}.com`,
        `https://jobs.${company.toLowerCase().replace(/\s+/g, '')}.com`
      ];
      
      for (const url of careerUrls) {
        try {
          const response = await axios.get(url, { 
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          const $ = cheerio.load(response.data);
          
          // Look for job listings
          $('a[href*="job"], .job-listing, .position').slice(0, 5).each((i, elem) => {
            const title = $(elem).text().trim();
            const link = $(elem).attr('href');
            
            if (title.length > 10 && title.toLowerCase().includes(roleKeyword)) {
              jobs.push({
                id: `company-${company}-${i}`,
                title: title,
                company: company,
                location: 'See job posting',
                salary: 'Competitive',
                type: 'Full-time',
                description: `Direct opportunity at ${company}`,
                requirements: [],
                postedDays: 0,
                applyUrl: link?.startsWith('http') ? link : `${url}${link}`,
                source: `${company} Careers`
              });
            }
          });
          
          break; // If successful, don't try other URLs
        } catch (err) {
          continue;
        }
      }
    } catch (error) {
      console.log(`Error scraping ${company}:`, error.message);
    }
  }
  
  return jobs;
}

// Helper functions
function calculateDaysAgo(dateString) {
  if (!dateString) return 0;
  try {
    const date = new Date(dateString);
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function formatSalary(min, max) {
  if (!min && !max) return null;
  if (min && max) {
    return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
  }
  if (min) return `$${Math.round(min / 1000)}k+`;
  return null;
}

function calculateMatchScore(job, skills) {
  if (!skills) return 70;
  
  const skillsList = skills.toLowerCase().split(',').map(s => s.trim());
  const jobText = `${job.title} ${job.description} ${job.requirements.join(' ')}`.toLowerCase();
  
  let matches = 0;
  skillsList.forEach(skill => {
    if (jobText.includes(skill)) matches++;
  });
  
  const baseScore = 60;
  const skillBonus = (matches / skillsList.length) * 35;
  const recencyBonus = job.postedDays < 7 ? 5 : 0;
  
  return Math.min(100, Math.round(baseScore + skillBonus + recencyBonus));
}
