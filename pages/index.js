import React, { useState } from 'react';

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentRole: '',
    yearsExperience: '',
    skills: '',
    targetRoles: '',
    preferredLocations: '',
    resume: ''
  });

  const handleSaveProfile = () => {
    setProfile(formData);
    alert('Profile saved! Now click Find Jobs.');
  };

  const handleFindJobs = async () => {
    if (!profile) {
      alert('Please save your profile first!');
      return;
    }

    setLoading(true);
    
    try {
      // Fetch real jobs from API
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetRoles: profile.targetRoles,
          preferredLocations: profile.preferredLocations,
          skills: profile.skills
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      
      if (data.jobs.length === 0) {
        alert('No jobs found. Try adjusting your search criteria.');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Failed to fetch jobs. Please try again.');
    } finally {
      setLoading(false);
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
              style={{ marginTop: '1.5rem', width: '100%', background: '#2563eb', color: 'white', padding: '0.75rem', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
            >
              Save Profile & Continue
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
                    <a 
                      href={job.applyUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ display: 'block', width: '100%', background: '#2563eb', color: 'white', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', textAlign: 'center', textDecoration: 'none' }}
                    >
                      Apply Now →
                    </a>
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
