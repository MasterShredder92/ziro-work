import { ZIQSkill } from '../types';

export const ZIQ_SKILLS: ZIQSkill[] = [
  {
    id: 'lead-scorer',
    name: 'Lead Scorer',
    description: 'Score leads based on conversion probability.',
    domain: 'Growth',
    status: 'active',
    icon: '🎯',
    action: async () => { console.log('Scoring leads...'); }
  },
  {
    id: 'smart-matcher',
    name: 'Smart Matcher',
    description: 'Match students to teachers.',
    domain: 'Operations',
    status: 'active',
    icon: '🤝',
    action: async () => { console.log('Matching students...'); }
  },
  {
    id: 'revenue-forecaster',
    name: 'Revenue Forecaster',
    description: 'Predict next month\'s revenue.',
    domain: 'Finance',
    status: 'active',
    icon: '📈',
    action: async () => { console.log('Forecasting revenue...'); }
  }
];
