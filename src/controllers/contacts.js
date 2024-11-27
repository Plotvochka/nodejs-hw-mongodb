import * as contactServices from '../services/contact.js';
import createHttpError from 'http-errors';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseContactsFilterParams.js';
import { saveFileToUploadDir } from '../utils/saveFileToUploadDir.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';
import { env } from '../utils/env.js';
import * as path from 'node:path';

export const getContactsController = async (req, res, next) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);
  const { _id: userId } = req.user;
  filter.userId = userId;

  const contacts = await contactServices.getContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    filter,
  });

  res.json({
    status: 200,
    message: 'Successfully found contacts!',
    data: contacts,
  });
};

export const getContactByIdController = async (req, res, next) => {
  const { id } = req.params;
  const data = await contactServices.getContactById(id);

  if (!data) {
    throw createHttpError(404, 'Contact not found');
  }

  res.json({
    status: 200,
    message: `Successfully found contact with id ${id}!`,
    data,
  });
};

export const addContactController = async (req, res, next) => {
  const { _id: userId } = req.user;
  let photo = null;
  if (req.file) {
    if (env('ENABLE_CLOUDINARY') === 'true') {
      photo = await saveFileToCloudinary(req.file, 'photo');
    } else {
      await saveFileToUploadDir(req.file);
      photo = path.join(req.file.filename);
    }
  }

  const data = await contactServices.addContact({ ...req.body, photo, userId });

  res.status(201).json({
    status: 201,
    message: 'Contacts successfully added',
    data,
  });
};

export const upsertContactController = async (req, res) => {
  const { id: _id } = req.params;

  const result = await contactServices.updateContact({
    _id,
    payload: req.body,
    options: { upsert: true },
  });

  const status = result.isNew ? 201 : 200;

  res.status(status).json({
    status,
    message: 'Contact update successfull',
    data: result,
  });
};

export const patchContactController = async (req, res) => {
  const { id: _id } = req.params;
  const { id: userId } = req.user;
  let photo = null;

  if (req.file) {
    if (env('ENABLE_CLOUDINARY') === 'true') {
      photo = await saveFileToCloudinary(req.file, 'photo');
    } else {
      await saveFileToUploadDir(req.file);
      photo = path.join('uploads', req.file.filename);
    }
  }
  const result = await contactServices.updateContact({
    _id,
    userId,
    payload: { ...req.body, ...(photo && { photo }) },
  });

  if (!result) {
    throw createHttpError(404, 'Contact not found');
  }

  res.json({
    status: 200,
    message: 'Successfully patched a contact!',
    result,
  });
};

export const deleteContactController = async (req, res) => {
  const { id: _id } = req.params;

  const data = await contactServices.deleteContact({ _id });

  if (!data) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(204).json({
    status: 204,
  });
};
