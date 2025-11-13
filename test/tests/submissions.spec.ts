import { test, expect, Page } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true,
});

test.describe.configure({ mode: 'serial' });
test.setTimeout(180000);

function getCookieHeader(response: any): string {
  const setCookieHeader = response.headers()['set-cookie'];
  if (setCookieHeader) {
    const cookiePairs = setCookieHeader.split(',').map((cookie: string) => {
      const [nameValue] = cookie.trim().split(';');
      return nameValue;
    }).filter(Boolean);
    return cookiePairs.join('; ');
  }
  return '';
}

test('Add teams and submissions', async ({ page }) => {
  const teams = [
    {
      name: 'NHM2I',
      password: 'NHM2IPass123',
      solveRate: 0.80,
      members: [
        { username: 'nhm2i_alice', email: 'alice@nhm2i.team', password: 'AlicePass123' },
        { username: 'nhm2i_bob', email: 'bob@nhm2i.team', password: 'BobPass123' },
        { username: 'nhm2i_charlie', email: 'charlie@nhm2i.team', password: 'CharliePass123' }
      ]
    },
    {
      name: 'HIP',
      password: 'HIPPass456',
      solveRate: 0.60,
      members: [
        { username: 'hip_david', email: 'david@hip.team', password: 'DavidPass123' },
        { username: 'hip_eve', email: 'eve@hip.team', password: 'EvePass123' }
      ]
    },
    {
      name: 'SECSEA',
      password: 'SECSEAPass789',
      solveRate: 0.90,
      members: [
        { username: 'secsea_frank', email: 'frank@secsea.team', password: 'FrankPass123' },
        { username: 'secsea_grace', email: 'grace@secsea.team', password: 'GracePass123' },
        { username: 'secsea_henry', email: 'henry@secsea.team', password: 'HenryPass123' },
        { username: 'secsea_iris', email: 'iris@secsea.team', password: 'IrisPass123' }
      ]
    },
    {
      name: 'HTB',
      password: 'HTBPass321',
      solveRate: 0.40,
      members: [
        { username: 'htb_jack', email: 'jack@htb.team', password: 'JackPass123' },
        { username: 'htb_kate', email: 'kate@htb.team', password: 'KatePass123' }
      ]
    },
    {
      name: 'NLVP',
      password: 'NLVPPass654',
      solveRate: 0.70,
      members: [
        { username: 'nlvp_leo', email: 'leo@nlvp.team', password: 'LeoPass123' },
        { username: 'nlvp_mia', email: 'mia@nlvp.team', password: 'MiaPass123' },
        { username: 'nlvp_noah', email: 'noah@nlvp.team', password: 'NoahPass123' }
      ]
    }
  ];

  const wrongFlags = [
    '123',
    '547',
    'NON',
    'blabla'
  ];

  for (const team of teams) {
    let creatorCookie = '';
    
    const creator = team.members[0];
    const registerResp = await page.request.post('https://pwnthemall.local/api/register', {
      data: {
        username: creator.username,
        email: creator.email,
        password: creator.password
      }
    });

    if (!registerResp.ok()) {
      const errorText = await registerResp.text();
      if (!errorText.includes('already exists')) {
        continue;
      }
    }

    const loginResp = await page.request.post('https://pwnthemall.local/api/login', {
      data: {
        username: creator.email,
        password: creator.password
      }
    });

    if (!loginResp.ok()) {
      continue;
    }

    creatorCookie = getCookieHeader(loginResp);

    await page.request.post('https://pwnthemall.local/api/teams', {
      data: {
        name: team.name,
        password: team.password
      },
      headers: { 'Cookie': creatorCookie }
    });

    await page.request.post('https://pwnthemall.local/api/logout', {
      headers: { 'Cookie': creatorCookie }
    });

    for (let i = 1; i < team.members.length; i++) {
      const member = team.members[i];

      await page.request.post('https://pwnthemall.local/api/register', {
        data: {
          username: member.username,
          email: member.email,
          password: member.password
        }
      });

      const memberLoginResp = await page.request.post('https://pwnthemall.local/api/login', {
        data: {
          username: member.email,
          password: member.password
        }
      });

      if (!memberLoginResp.ok()) continue;

      const memberCookie = getCookieHeader(memberLoginResp);

      await page.request.post('https://pwnthemall.local/api/teams/join', {
        data: {
          name: team.name,
          password: team.password
        },
        headers: { 'Cookie': memberCookie }
      });

      await page.request.post('https://pwnthemall.local/api/logout', {
        headers: { 'Cookie': memberCookie }
      });
    }
  }

  const firstUser = teams[0].members[0];
  const challengeLoginResp = await page.request.post('https://pwnthemall.local/api/login', {
    data: {
      username: firstUser.email,
      password: firstUser.password
    }
  });

  const challengeCookie = getCookieHeader(challengeLoginResp);
  const challengesResp = await page.request.get('https://pwnthemall.local/api/challenges', {
    headers: { 'Cookie': challengeCookie }
  });

  let challenges: any[] = [];
  if (challengesResp.ok()) {
    challenges = await challengesResp.json();
  }

  await page.request.post('https://pwnthemall.local/api/logout', {
    headers: { 'Cookie': challengeCookie }
  });

  if (challenges.length === 0) {
    return;
  }
  
  for (const team of teams) {
    
    const loginResp = await page.request.post('https://pwnthemall.local/api/login', {
      data: {
        username: team.members[0].email,
        password: team.members[0].password
      }
    });

    const cookie = getCookieHeader(loginResp);
    
    const numToSolve = Math.floor(challenges.length * team.solveRate);
    
    for (let i = 0; i < numToSolve; i++) {
      const challenge = challenges[i];
      
      const numWrongAttempts = 2 + Math.floor(Math.random() * 3);
      for (let w = 0; w < numWrongAttempts; w++) {
        await page.request.post(`https://pwnthemall.local/api/challenges/${challenge.id}/submit`, {
          data: { flag: wrongFlags[Math.floor(Math.random() * wrongFlags.length)] },
          headers: { 'Cookie': cookie }
        });
      }
      
      if (challenge.flags && challenge.flags.length > 0) {
        const correctFlag = challenge.flags[0].value;
        await page.request.post(`https://pwnthemall.local/api/challenges/${challenge.id}/submit`, {
          data: { flag: correctFlag },
          headers: { 'Cookie': cookie }
        });
      }
    }
    
    const numNoiseAttempts = 5 + Math.floor(Math.random() * 6);
    for (let n = 0; n < numNoiseAttempts; n++) {
      const randomChallenge = challenges[numToSolve + Math.floor(Math.random() * (challenges.length - numToSolve))];
      if (randomChallenge) {
        await page.request.post(`https://pwnthemall.local/api/challenges/${randomChallenge.id}/submit`, {
          data: { flag: wrongFlags[Math.floor(Math.random() * wrongFlags.length)] },
          headers: { 'Cookie': cookie }
        });
      }
    }
    
    await page.request.post('https://pwnthemall.local/api/logout', {
      headers: { 'Cookie': cookie }
    });
  }

});
