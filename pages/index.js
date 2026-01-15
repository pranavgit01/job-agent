import React, { useState } from 'react';

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentRole: '',
    yearsExperience: '',
    skills: '',
    targetRoles: '',
    preferredLocations: '',
    salaryExpectation: '',
    companyPreferences: '',
    resume: ''
  });

  const handleSaveProfile = async () => {
    console.log('🔵 [PROFILE SAVE] Button clicked');
    console.log('🔵 [PROFILE SAVE] Form data:', formData);

    // Validate form data
    if (!formData.email || !formData.fullName || !formData.skills) {
      console.log('❌ [PROFILE SAVE] Missing required fields');
      alert('Please fill in all required fields (email, name, skills)');
      return;
    }

    setLoading(true);

    try {
      console.log('🔵 [PROFILE SAVE] Sending POST request to /api/profile');
      
      // Prepare data for API
      const profileData = {
        email: formData.email,
        name: formData.fullName,
        phone: formData.phone,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        experience: formData.yearsExperience || '0',
        location: formData.preferredLocations || 'Remote',
        jobTitle: formData.currentRole || 'Not specified',
        preferredIndustries: formData.targetRoles.split(',').map(s => s.trim()).filter(s => s),
        salaryExpectation: formData.salaryExpectation || '',
        companyPreferences: formData.companyPreferences || '',
        resume: formData.resume || '',
        salaryMin: 0,
        salaryMax: 0,
        workMode: 'remote',
      };

      console.log('🔵 [PROFILE SAVE] Prepared data:', profileData);

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      console.log('🔵 [PROFILE SAVE] Response status:', response.status);
      
      const data = await response.json();
      console.log('🔵 [PROFILE SAVE] Response data:', data);

      if (response.ok) {
        console.log('✅ [PROFILE SAVE] Profile saved successfully!');
        setProfile(formData);
        alert('✅ Profile saved successfully! Now you can find jobs.');
      } else {
        console.error('❌ [PROFILE SAVE] Error response:', data);
        alert(`❌ Error saving profile: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ [PROFILE SAVE] Fetch error:', error);
      console.error('❌ [PROFILE SAVE] Error details:', {
        message: error.message,
        stack: error.stack,
      });
      alert(`❌ Failed to save profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFindJobs = async () => {
    console.log('🔵 [JOB SEARCH] Search button clicked');
    
    if (!profile) {
      console.log('❌ [JOB SEARCH] No profile saved');
      alert('Please save your profile first!');
      return;
    }

    console.log('🔵 [JOB SEARCH] Profile data:', profile);
    setLoading(true);
    
    try {
      const searchParams = {
        targetRoles: profile.targetRoles,
        preferredLocations: profile.preferredLocations,
        skills: profile.skills,
        companies: [] // Add company list if needed
      };

      console.log('🔵 [JOB SEARCH] Sending POST request to /api/jobs/search');
      console.log('🔵 [JOB SEARCH] Search params:', searchParams);

      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams)
      });

      console.log('🔵 [JOB SEARCH] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [JOB SEARCH] Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch jobs');
      }

      const data = await response.json();
      console.log('🔵 [JOB SEARCH] Response data:', data);
      console.log('✅ [JOB SEARCH] Found', data.jobs?.length || 0, 'jobs');
      
      setJobs(data.jobs || []);
      
      if (!data.jobs || data.jobs.length === 0) {
        console.log('⚠️ [JOB SEARCH] No jobs found');
        alert('No jobs found. Try adjusting your search criteria or check if API keys are configured.');
      }
    } catch (error) {
      console.error('❌ [JOB SEARCH] Fetch error:', error);
      console.error('❌ [JOB SEARCH] Error details:', {
        message: error.message,
        stack: error.stack,
      });
      alert(`Failed to fetch jobs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCoverLetter = async (job) => {
    console.log('🔵 [COVER LETTER] Generating for job:', job.title);
    console.log('🔵 [COVER LETTER] User profile:', profile);

    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: `${job.title} at ${job.company}\n\nLocation: ${job.location}\n\n${job.description}`,
          userProfile: {
            skills: profile.skills.split(',').map(s => s.trim()),
            experience: profile.yearsExperience,
            jobTitle: profile.currentRole,
            name: profile.fullName,
          },
        }),
      });

      console.log('🔵 [COVER LETTER] Response status:', response.status);
      
      const data = await response.json();
      console.log('🔵 [COVER LETTER] Response:', data);

      if (response.ok) {
        console.log('✅ [COVER LETTER] Generated successfully');
        // Create a modal or download the cover letter
        const blob = new Blob([data.coverLetter], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cover-letter-${job.company}.txt`;
        a.click();
        alert('Cover letter downloaded!');
      } else {
        console.error('❌ [COVER LETTER] Error:', data.error);
        alert('Error generating cover letter: ' + data.error);
      }
    } catch (error) {
      console.error('❌ [COVER LETTER] Fetch error:', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🚀 AI Job Application Agent
          </h1>
          <p style={{ color: '#6b7280' }}>Your intelligent job hunting assistant</p>
        </div>

        {!profile ? (
          <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Create Your Profile</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Full Name *"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
              />
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
              />
              <input
                type="text"
                placeholder="Current Role *"
                value={formData.currentRole}
                onChange={(e) => setFormData({...formData, currentRole: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
              />
              <input
                type="number"
                placeholder="Years of Experience *"
                value={formData.yearsExperience}
                onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem' }}
              />
              <input
                type="text"
                placeholder="Skills (comma separated) *"
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', gridColumn: 'span 2' }}
              />
              <input
                type="text"
                placeholder="Target Roles (e.g., Software Engineer, PM) *"
                value={formData.targetRoles}
                onChange={(e) => setFormData({...formData, targetRoles: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', gridColumn: 'span 2' }}
              />
              <input
                type="text"
                placeholder="Preferred Locations (e.g., Remote, San Francisco)"
                value={formData.preferredLocations}
                onChange={(e) => setFormData({...formData, preferredLocations: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', gridColumn: 'span 2' }}
              />
              <input
                type="text"
                placeholder="Salary Expectation (e.g., $100k - $150k)"
                value={formData.salaryExpectation}
                onChange={(e) => setFormData({...formData, salaryExpectation: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', gridColumn: 'span 2' }}
              />
              <input
                type="text"
                placeholder="Company Preferences (e.g., Remote-first, Startups, Fortune 500)"
                value={formData.companyPreferences}
                onChange={(e) => setFormData({...formData, companyPreferences: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', gridColumn: 'span 2' }}
              />
              <textarea
                placeholder="Resume Summary *"
                value={formData.resume}
                onChange={(e) => setFormData({...formData, resume: e.target.value})}
                rows="4"
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', gridColumn: 'span 2' }}
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              style={{ marginTop: '1.5rem', width: '100%', background: '#2563eb', color: 'white', padding: '0.75rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '💾 Saving...' : '💾 Save Profile & Continue'}
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={handleFindJobs}
              disabled={loading}
              style={{ width: '100%', background: '#2563eb', color: 'white', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '1.5rem', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '🔍 Searching...' : '🔍 Find Jobs'}
            </button>

            {jobs.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Found {jobs.length} Jobs</h2>
                {jobs.map(job => (
                  <div key={job.id} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{job.title}</h3>
                        <p style={{ color: '#6b7280' }}>{job.company}</p>
                      </div>
                      <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.5rem 1rem', borderRadius: '9999px', fontWeight: '600', fontSize: '0.875rem' }}>
                        {job.matchScore}% Match
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                      <span>📍 {job.location}</span>
                      <span>💰 {job.salary}</span>
                      <span>🕐 Posted {job.postedDays}d ago</span>
                    </div>
                    <p style={{ marginBottom: '1rem', color: '#374151' }}>{job.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {job.requirements.map((req, i) => (
                        <span key={i} style={{ background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                          {req}
                        </span>
                      ))}
                    </div>
                    {job.source && (
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                        Source: {job.source}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a 
                        href={job.applyUrl || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ flex: 1, background: '#2563eb', color: 'white', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', textAlign: 'center', textDecoration: 'none' }}
                      >
                        Apply Now →
                      </a>
                      <button
                        onClick={() => handleGenerateCoverLetter(job)}
                        style={{ flex: 1, background: '#7c3aed', color: 'white', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                      >
                        📝 Generate Cover Letter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
