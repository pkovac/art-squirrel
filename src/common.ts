import * as requestPromise from "request-promise-native";
import * as request from "request";

export const APPNAME = "art-squirrel";

export interface CollectionEntry {
  id?: string;
  type: string;
  config: CollectionConfig;
}

export interface SiteEntry {
  id?: string;
  type: string;
  config: SiteConfig;
}

export interface SubmissionMetadata {
  imageUrl: string;
  title: string;
  dateUploaded: Date;
  artist: {
    name: string;
    url?: string;
  };
  tags: Map<string, string>;
}

export interface SubmissionIdentifier {
  readonly id: string;
  readonly site: string;
}

export interface Submission extends SubmissionIdentifier {
  image(): Promise<Fetchable>;
  metadata(): Promise<SubmissionMetadata>;
}

export function makeStaticSubmission(
  identifier: SubmissionIdentifier,
  metadata: SubmissionMetadata,
  buffer?: Buffer
): Submission {
  const fetchable = new StaticFetchable(buffer);
  return {
    ...identifier,
    image: () => Promise.resolve(fetchable),
    metadata: () => Promise.resolve(metadata)
  };
}

export interface SiteConfig {
  target: string[];
  query: string[];
  [key: string]: any;
}

export interface Site {
  readonly config: SiteConfig;
  submissions(): AsyncIterableIterator<Submission>;
}

export abstract class Fetchable {
  url: string;
  headers: request.Headers;
  private contentPromise: Promise<Buffer> | null;
  content(): Promise<Buffer> {
    if (!this.contentPromise)
      this.contentPromise = requestPromise({
        url: this.url,
        headers: this.headers,
        encoding: null
      });
    return this.contentPromise;
  }
}
export class BasicFetchable extends Fetchable {
  constructor(readonly url: string, readonly headers: request.Headers) {
    super();
  }
}

export class StaticFetchable extends Fetchable {
  url = "";
  headers = {};
  constructor(private readonly staticContent: Buffer | null) {
    super();
  }
  content(): Promise<Buffer> {
    if (this.staticContent === null) {
      Promise.reject("No content supplied for this StaticFetchable.");
    } else {
      return Promise.resolve(this.staticContent);
    }
  }
}

/* Collection configuration types */

export interface CollectionConfig {
  id?: string; // For reference by SiteConfig.collectionTarget
  [key: string]: any;
}

export interface Collection {
  get?(submissionId: SubmissionIdentifier): Submission;
  store(submission: Submission): Promise<void>;
  listIds(): Promise<SubmissionIdentifier[]>;
  list?(): Promise<Submission[]>;
}

export interface FiletypeHandler {
  mimeTypes: string[];
  serializer: (submission: Submission) => Promise<Buffer>;
  deserializer: (content: Promise<Buffer>) => Promise<Submission>;
}

type StringObj = { [key: string]: string };
export function mapToObject(map: Map<string, string>): StringObj {
  const newObject: StringObj = {};
  for (const [key, value] of map.entries()) {
    newObject[key] = value;
  }
  return newObject;
}

export function objectToMap(object: StringObj): Map<string, string> {
  return new Map<string, string>(Object.entries(object));
}
