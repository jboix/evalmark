/**
 * The pull request comment, through GitHub's REST API with `fetch`. The suite's comment carries a
 * hidden marker, so each run updates it in place instead of adding another.
 */

/** Where and how to comment. */
export interface CommentTarget {
  /** The API's address, `GITHUB_API_URL`. */
  readonly apiUrl: string;
  /** The repository, as `owner/name`. */
  readonly repository: string;
  /** The pull request's number. */
  readonly pullRequest: number;
  /** The token. */
  readonly token: string;
}

/** A comment as the API lists it. */
interface IssueComment {
  /** Its id. */
  readonly id: number;
  /** Its text. */
  readonly body?: string;
}

/** How many comments a page lists. */
const pageSize = 100;

/**
 * Calls the API.
 *
 * @param target - Where, and the token.
 * @param path - The path after the API's address.
 * @param init - The method and the body.
 * @returns The parsed response.
 * @throws When the API answers with an error.
 */
async function callApi(
  target: CommentTarget,
  path: string,
  init: { readonly method: string; readonly body?: string } = { method: 'GET' },
): Promise<unknown> {
  const response = await fetch(`${target.apiUrl.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${target.token}`,
      'content-type': 'application/json',
      'user-agent': 'evalmark',
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub answered ${response.status} to ${init.method} ${path}.`);
  }
  return response.json();
}

/**
 * Finds the comment carrying the marker, reading every page of the pull request's comments.
 *
 * @param target - The pull request.
 * @param marker - The marker.
 * @returns The comment's id, or `undefined` when there is none.
 */
export async function findComment(
  target: CommentTarget,
  marker: string,
): Promise<number | undefined> {
  const base = `/repos/${target.repository}/issues/${target.pullRequest}/comments`;
  for (let page = 1; ; page += 1) {
    const comments = (await callApi(
      target,
      `${base}?per_page=${pageSize}&page=${page}`,
    )) as IssueComment[];
    const found = comments.find((comment) => comment.body?.includes(marker));
    if (found) return found.id;
    if (comments.length < pageSize) return undefined;
  }
}

/**
 * Creates the comment, or updates the one carrying the marker.
 *
 * @param target - The pull request.
 * @param marker - The marker, which the body contains.
 * @param body - The comment's Markdown.
 * @returns Whether it was `created` or `updated`.
 */
export async function upsertComment(
  target: CommentTarget,
  marker: string,
  body: string,
): Promise<'created' | 'updated'> {
  const existing = await findComment(target, marker);
  const payload = JSON.stringify({ body });
  if (existing !== undefined) {
    const path = `/repos/${target.repository}/issues/comments/${existing}`;
    await callApi(target, path, { method: 'PATCH', body: payload });
    return 'updated';
  }
  const path = `/repos/${target.repository}/issues/${target.pullRequest}/comments`;
  await callApi(target, path, { method: 'POST', body: payload });
  return 'created';
}
