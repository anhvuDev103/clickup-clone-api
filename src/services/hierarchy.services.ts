import { ObjectId } from 'mongodb';

import { CreateListRequestBody, CreateSpaceRequestBody } from '@/models/requests/hierarchy.requests';
import { GetHierarchyResponse } from '@/models/responses/hierarchy.responses';
import List from '@/models/schemas/List.schema';
import Space from '@/models/schemas/Space.schema';
import { generateGetHierachyAggregate } from '@/utils/aggregates';

import databaseService from './database.services';

class HierarchyService {
  /**========================================================================================================================
   * Get the hierarchy.
   *
   * @param {string} user_id - The id of user.
   * @param {string} workspace_id - The emails of the space members, provided by the user.
   *
   * @returns {Promise<GetHierarchyResponse>} - Returns GetHierarchyResponse[].
   *
   * @throws {Error} if any database side errors occur.
   */

  async getHierarchy(user_id: string, workspace_id: string): Promise<GetHierarchyResponse[]> {
    const hierarchy = await databaseService.spaces
      .aggregate<GetHierarchyResponse>(generateGetHierachyAggregate(user_id, workspace_id))
      .toArray();

    return hierarchy;
  }

  /**========================================================================================================================
   * Create new space.
   *
   * @param {string} user_id - The id of user.
   * @param {Object} payload - An object containing space create information.
   * @param {string} payload.name - The name space provided by the user.
   * @param {string} payload.description - The description space provided by the user.
   * @param {boolean} payload.is_private - The boolean represents a private space provided by the user.
   * @param {Array} payload.member_emails - The emails of the space members, provided by the user.
   * @param {string} payload.workspace_id - The emails of the space members, provided by the user.
   *
   * @returns {Promise<void>} - Returns nothing.
   *
   * @throws {Error} if any database side errors occur.
   */

  async createSpace(user_id: string, payload: CreateSpaceRequestBody): Promise<void> {
    const member_ids = await databaseService.getUserIdByExistingEmails(payload.member_emails, {
      excludedEmail: user_id,
    });

    await databaseService.spaces.insertOne(
      new Space({
        ...payload,
        owner_id: new ObjectId(user_id),
        workspace_id: new ObjectId(payload.workspace_id),
        member_ids,
      }),
    );
  }

  /**========================================================================================================================
   * Create new list.
   *
   * @param {string} user_id - The id of user.
   * @param {Object} payload - An object containing space create information.
   * @param {string} payload.name - The name space provided by the user.
   * @param {boolean} payload.is_private - The boolean represents a private space provided by the user.
   * @param {string} payload.parent_id - The emails of the space members, provided by the user.
   *
   * @returns {Promise<void>} - Returns nothing.
   *
   * @throws {Error} if any database side errors occur.
   */

  async createList(user_id: string, payload: CreateListRequestBody): Promise<void> {
    const member_ids = await databaseService.getUserIdByExistingEmails(payload.member_emails, {
      excludedEmail: user_id,
    });

    await databaseService.lists.insertOne(
      new List({
        ...payload,
        parent_id: payload.parent_id ? new ObjectId(payload.parent_id) : undefined,
        member_ids,
      }),
    );
  }
}

const hierarchyService = new HierarchyService();

export default hierarchyService;
