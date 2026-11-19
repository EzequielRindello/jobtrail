import { apiRequest } from './client';

export interface Skill {
  id: string;
  name: string;
}

export async function getSkills() {
  return apiRequest<Skill[]>('/api/skills', undefined, 'GET');
}

export async function addSkill(name: string) {
  return apiRequest<Skill>('/api/skills', { name });
}

export async function deleteSkill(id: string) {
  return apiRequest(`/api/skills/${id}`, undefined, 'DELETE');
}
