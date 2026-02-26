
import { SavedProject, UserProfile, AirtableConfig } from '../types';
import { compressImageForStorage } from '../utils/imageUtils';

// Updated to use the specific Table IDs provided
const USERS_TABLE = 'tblAOXfMEYuaGaizI';
const PROJECTS_TABLE = 'tblMPDwpIf6GSftLO';

// Airtable API helpers
const getHeaders = (apiKey: string) => ({
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
});

const getBaseUrl = (baseId: string) => `https://api.airtable.com/v0/${baseId}`;

export const checkAirtableConnection = async (config: AirtableConfig): Promise<boolean> => {
    try {
        console.log(`[Airtable] Checking connection to table: ${USERS_TABLE}`);
        const response = await fetch(`${getBaseUrl(config.baseId)}/${USERS_TABLE}?maxRecords=1`, {
            headers: getHeaders(config.apiKey)
        });
        if (!response.ok) {
            console.error(`[Airtable] Check failed: ${response.status} ${response.statusText}`);
            const txt = await response.text();
            console.error(`[Airtable] Response: ${txt}`);
        }
        return response.ok;
    } catch (e) {
        console.error("[Airtable] Check connection error:", e);
        return false;
    }
};

export const loginOrRegisterUser = async (config: AirtableConfig, username: string): Promise<UserProfile> => {
    // 1. Search for user
    const filterByFormula = encodeURIComponent(`{Name} = '${username}'`);
    const searchUrl = `${getBaseUrl(config.baseId)}/${USERS_TABLE}?filterByFormula=${filterByFormula}`;
    
    console.log(`[Airtable] Searching user with url: ${searchUrl}`);
    
    const res = await fetch(searchUrl, { headers: getHeaders(config.apiKey) });
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`[Airtable] Login Search Failed (${res.status}):`, errorText);
        throw new Error(`Airtable Error: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    console.log(`[Airtable] Search result:`, data);
    
    if (data.records && data.records.length > 0) {
        // User exists
        console.log(`[Airtable] User found:`, data.records[0].fields.Name);
        const record = data.records[0];
        return {
            username: record.fields.Name,
            recordId: record.id,
            subjectImageBase64: record.fields.SubjectImage || null,
            systemPrompt: record.fields.SystemPrompt || ''
        };
    } else {
        // Create user
        const createUrl = `${getBaseUrl(config.baseId)}/${USERS_TABLE}`;
        console.log(`[Airtable] User not found. Creating at: ${createUrl}`);
        
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: getHeaders(config.apiKey),
            body: JSON.stringify({
                fields: {
                    Name: username,
                    SubjectImage: '',
                    SystemPrompt: ''
                }
            })
        });

        if (!createRes.ok) {
            const errorText = await createRes.text();
            console.error(`[Airtable] User Creation Failed (${createRes.status}):`, errorText);
            throw new Error(`Failed to create user: ${errorText}`);
        }

        const createData = await createRes.json();
        console.log(`[Airtable] User created:`, createData);
        return {
            username: createData.fields.Name,
            recordId: createData.id,
            subjectImageBase64: null,
            systemPrompt: ''
        };
    }
};

export const updateUserSubject = async (config: AirtableConfig, user: UserProfile, imageUrl: string): Promise<void> => {
    if (!user.recordId) throw new Error("User has no Record ID");
    
    let imageToSave = imageUrl;
    
    // Fallback if base64
    if (imageUrl.startsWith('data:')) {
         imageToSave = await compressImageForStorage(imageUrl);
    }

    const url = `${getBaseUrl(config.baseId)}/${USERS_TABLE}/${user.recordId}`;
    console.log(`[Airtable] Updating subject for user ${user.recordId}`);

    const res = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(config.apiKey),
        body: JSON.stringify({
            fields: {
                SubjectImage: imageToSave
            }
        })
    });

    if (!res.ok) {
        const err = await res.text();
        console.error(`[Airtable] Update Subject Failed:`, err);
        throw new Error(err);
    }
};

export const updateUserSystemPrompt = async (config: AirtableConfig, user: UserProfile, systemPrompt: string): Promise<void> => {
    if (!user.recordId) throw new Error("User has no Record ID");

    const url = `${getBaseUrl(config.baseId)}/${USERS_TABLE}/${user.recordId}`;
    console.log(`[Airtable] Updating system prompt for user ${user.recordId}`);

    const res = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(config.apiKey),
        body: JSON.stringify({
            fields: {
                SystemPrompt: systemPrompt
            }
        })
    });

    if (!res.ok) {
        const err = await res.text();
        console.error(`[Airtable] Update System Prompt Failed:`, err);
        throw new Error(err);
    }
};

export const getUserProjects = async (config: AirtableConfig, username: string): Promise<SavedProject[]> => {
    const filterByFormula = encodeURIComponent(`{Username} = '${username}'`);
    const url = `${getBaseUrl(config.baseId)}/${PROJECTS_TABLE}?filterByFormula=${filterByFormula}&sort[0][field]=CreatedAt&sort[0][direction]=desc`;
    
    console.log(`[Airtable] Fetching projects for ${username}`);
    const res = await fetch(url, { headers: getHeaders(config.apiKey) });
    
    if (!res.ok) {
        const err = await res.text();
        console.error(`[Airtable] Get Projects Failed:`, err);
        throw new Error(err);
    }

    const data = await res.json();
    console.log(`[Airtable] Projects found: ${data.records?.length}`);
    
    return data.records.map((record: any) => {
        try {
            const parsed = JSON.parse(record.fields.JSON);
            return {
                ...parsed,
                id: record.id, // Use Airtable ID
                airtableId: record.id
            };
        } catch (e) {
            console.warn(`[Airtable] Failed to parse project JSON for record ${record.id}`, e);
            return null;
        }
    }).filter(Boolean);
};

export const saveProjectToAirtable = async (config: AirtableConfig, username: string, project: SavedProject): Promise<void> => {
    const payload = {
        ...project,
        subjectImageBase64: undefined 
    };

    const fields = {
        Name: project.name,
        Username: username,
        CreatedAt: new Date().toISOString(),
        JSON: JSON.stringify(payload)
    };

    const url = `${getBaseUrl(config.baseId)}/${PROJECTS_TABLE}`;
    console.log(`[Airtable] Saving project: ${project.name}`);

    const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(config.apiKey),
        body: JSON.stringify({ fields })
    });

    if (!res.ok) {
        const err = await res.text();
        console.error(`[Airtable] Save Project Failed:`, err);
        throw new Error(err);
    }
};

export const deleteProjectFromAirtable = async (config: AirtableConfig, id: string): Promise<void> => {
    const url = `${getBaseUrl(config.baseId)}/${PROJECTS_TABLE}/${id}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders(config.apiKey)
    });
    
    if (!res.ok) {
        const err = await res.text();
        console.error(`[Airtable] Delete Project Failed:`, err);
        throw new Error(err);
    }
};
