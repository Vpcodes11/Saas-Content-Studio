export interface GitHubIngestResult {
  title: string;
  repo: string;
  owner: string;
  description: string;
  stars: number;
  license: string;
  readme: string;
  manifest: string;
  changelog: string;
  fileTree: string[];
  combinedContent: string;
}

export async function ingestGitHubRepo(
  repoInput: string,
  token?: string
): Promise<GitHubIngestResult> {
  // Parse owner and repo from URL or "owner/repo" string
  let owner = '';
  let repo = '';

  const clean = repoInput.trim().replace(/\/+$/, '');
  const match = clean.match(/github\.com\/([^/]+)\/([^/]+)/i) || clean.match(/^([^/]+)\/([^/]+)$/);
  if (match) {
    owner = match[1];
    repo = match[2].replace(/\.git$/i, '');
  } else {
    throw new Error(`Invalid GitHub repository format: "${repoInput}". Use https://github.com/owner/repo or owner/repo.`);
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'SaaS-Content-Studio-Ingest',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // 1. Fetch Repo Info
  let description = '';
  let stars = 0;
  let license = 'None specified';
  try {
    const infoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (infoRes.ok) {
      const info = await infoRes.json();
      description = info.description || '';
      stars = info.stargazers_count || 0;
      license = info.license?.name || 'None specified';
    }
  } catch (err) {
    console.warn('Failed fetching repo info:', err);
  }

  // 2. Fetch README
  let readme = '';
  try {
    // Try raw github user content first (doesn't count against rate limits)
    const rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`);
    if (rawRes.ok) {
      readme = await rawRes.text();
    } else {
      const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.content && data.encoding === 'base64') {
          readme = Buffer.from(data.content, 'base64').toString('utf-8');
        }
      }
    }
  } catch (err) {
    console.warn('Failed fetching README:', err);
  }

  // 3. Fetch Package Manifest (package.json, Cargo.toml, pyproject.toml)
  let manifest = '';
  const manifestCandidates = ['package.json', 'Cargo.toml', 'pyproject.toml', 'go.mod'];
  for (const filename of manifestCandidates) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${filename}`);
      if (res.ok) {
        const text = await res.text();
        manifest = `[${filename}]\n${text.slice(0, 3000)}`;
        break;
      }
    } catch {}
  }

  // 4. Fetch CHANGELOG
  let changelog = '';
  const changelogCandidates = ['CHANGELOG.md', 'History.md', 'RELEASES.md'];
  for (const filename of changelogCandidates) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${filename}`);
      if (res.ok) {
        changelog = await res.text();
        changelog = changelog.slice(0, 4000); // truncate if very long
        break;
      }
    } catch {}
  }

  // 5. Fetch File Tree (Top 50 files)
  const fileTree: string[] = [];
  try {
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers });
    if (treeRes.ok) {
      const data = await treeRes.json();
      if (Array.isArray(data.tree)) {
        for (const item of data.tree.slice(0, 60)) {
          if (item.path && !item.path.startsWith('.') && !item.path.includes('node_modules')) {
            fileTree.push(item.path);
          }
        }
      }
    }
  } catch {}

  const combinedParts: string[] = [
    `# GitHub Repository: ${owner}/${repo}`,
    description ? `Description: ${description}` : '',
    `Stars: ${stars} | License: ${license}`,
    '',
    '## README.md',
    readme || 'No README found.',
    '',
    manifest ? `## Package Manifest\n${manifest}\n` : '',
    changelog ? `## Recent Changelog\n${changelog}\n` : '',
    fileTree.length ? `## Repository Structure\n${fileTree.map(f => `- ${f}`).join('\n')}\n` : '',
  ];

  const combinedContent = combinedParts.filter(Boolean).join('\n');

  return {
    title: `${owner}/${repo}`,
    repo,
    owner,
    description,
    stars,
    license,
    readme,
    manifest,
    changelog,
    fileTree,
    combinedContent,
  };
}
