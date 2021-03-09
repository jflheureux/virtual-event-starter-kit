/**
 * Copyright 2020 Vercel Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Job, Sponsor, Stage, Speaker } from '@lib/types';

const API_URL = 'https://graphql.datocms.com/';
const API_TOKEN = process.env.DATOCMS_READ_ONLY_API_TOKEN;

async function fetchCmsAPI(query: string, { variables }: { variables?: Record<string, any> } = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  const json = await res.json();
  if (json.errors) {
    // eslint-disable-next-line no-console
    console.error(json.errors);
    throw new Error('Failed to fetch API');
  }

  return json.data;
}

async function fetchContentHubAPI(query: string, { variables }: { variables?: Record<string, any> } = {}) {
  const res = await fetch(`${process.env.SITECORE_CONTENT_HUB_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GQL-Token': `${process.env.SITECORE_CONTENT_HUB_READ_ONLY_API_KEY}`
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  const json = await res.json();
  if (json.errors) {
    // eslint-disable-next-line no-console
    console.error(json.errors);
    throw new Error('Failed to fetch API');
  }

  return json.data;
}

function getFieldPrefix(typeId: string) {
  if (typeId[0] >= '0' && typeId[0] <= '9') {
    return '_' + typeId.substr(1);
  }

  return typeId;
}

export async function getAllSpeakers(): Promise<Speaker[]> {
  const data = await fetchCmsAPI(`
    {
      allSpeakers(first: 100) {
        name
        bio
        title
        slug
        twitter
        github
        company
        talk {
          title
          description
        }
        image {
          url(imgixParams: {fm: jpg, fit: crop, w: 300, h: 400})
        }
        imageSquare: image {
          url(imgixParams: {fm: jpg, fit: crop, w: 192, h: 192})
        }
      }
    }
  `);

  return data.allSpeakers;
}

export async function getAllStages(): Promise<Stage[]> {
  const typeId = `${process.env.STAGE_TYPE_ID}`;
  const fieldPrefix = getFieldPrefix(`${process.env.STAGE_TYPE_ID}`);

  const data = await fetchContentHubAPI(`
    {
      allStages: allM_Content_${typeId}(first: 100, orderBy: CONTENT_NAME_ASC) {
        results {
          name: ${fieldPrefix}_name
          slug: ${fieldPrefix}_slug
          stream: ${fieldPrefix}_stream
          discord: ${fieldPrefix}_discord
        }
      }
    }
  `);

  // schedule {
  //   title
  //   start
  //   end
  //   speaker {
  //     name
  //     slug
  //     image {
  //       url(imgixParams: {fm: jpg, fit: crop, w: 120, h: 120})
  //     }
  //   }
  // }

  return data.allStages.results.map(function (stage: any) {
    return {
      ...stage,
      schedule: []
    }
  });
}

export async function getAllSponsors(): Promise<Sponsor[]> {
  const data = await fetchCmsAPI(`
    {
      allCompanies(first: 100, orderBy: tierRank_ASC) {
        name
        description
        slug
        website
        callToAction
        callToActionLink
        discord
        youtubeSlug
        tier
        links {
          url
          text
        }
        cardImage {
          url(imgixParams: {fm: jpg, fit: crop})
        }
        logo {
          url(imgixParams: {fm: jpg, fit: crop, w: 100, h: 100})
        }
      }
    }
  `);

  return data.allCompanies;
}

export async function getAllJobs(): Promise<Job[]> {
  const typeId = `${process.env.JOB_POSTING_TYPE_ID}`;
  const fieldPrefix = getFieldPrefix(`${process.env.JOB_POSTING_TYPE_ID}`);

  const data = await fetchContentHubAPI(`
    {
      allJobs: allM_Content_${typeId}(first: 100, orderBy: CONTENT_NAME_ASC) {
        results {
          id
          title: ${fieldPrefix}_Title
          description: ${fieldPrefix}_description
          companyName: ${fieldPrefix}_companyName
          discord: ${fieldPrefix}_discord
          link: ${fieldPrefix}_link
        }
      }
    }
  `);

  return data.allJobs.results;
}
