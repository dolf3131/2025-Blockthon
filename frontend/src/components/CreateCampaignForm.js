import React from 'react';

const CreateCampaignForm = ({ name, setName, description, setDescription, organizerName, setOrganizerName, goal, setGoal, duration, setDuration, createCampaign }) => {
  return (
    <div className="campaign-form card">
      <h3>Create a New Campaign</h3>
      <input 
        type="text" 
        placeholder="Campaign Name" 
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input 
        type="text" 
        placeholder="Campaign Description" 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input 
        type="text" 
        placeholder="Organizer Name" 
        value={organizerName}
        onChange={(e) => setOrganizerName(e.target.value)}
      />
      <input 
        type="number" 
        placeholder="Fundraising Goal (in SUI)" 
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />
      <input 
        type="number" 
        placeholder="Campaign Duration (in days)" 
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
      />
      <button onClick={createCampaign}>Create</button>
    </div>
  );
};

export default CreateCampaignForm;
