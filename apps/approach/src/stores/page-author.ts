import { Signal, signal } from '@lit-labs/signals';
import { LinkResource, Page, PageAuthor, ResourceGraph } from '../types';
import { AsyncComputed } from 'signal-utils/async-computed';
import { userSignal } from './auth';

export class PageAuthorState {
  #uid = signal('void');
  set uid(value: string) {
    this.#uid.set(value);
    // Ideally we woudn't have to do this, but the renderAsyncComputed()
    // helper only accesses .status, which doesn't kick off the computed
    // this.#pageAuthorState.run();
  }
  get uid() {
    return this.#uid.get();
  }

  #markdown = signal('');
  set markdown(value: string) {
    this.#markdown.set(value);
  }
  get markdown() {
    return this.#markdown.get();
  }

  #resourceName = signal('');
  set resourceName(value: string) {
    this.#resourceName.set(value);
  }

  #linkResource: Signal.State<LinkResource> = signal(undefined);
  set linkResource(value: LinkResource) {
    console.log(`Processing link resource: ${value?.urlMediaType} ${value?.makeAdd} ${value?.url}`);
    const current: PageAuthor = this.#pageAuthor.get();
    if (current) {
      this._updatePageAuthor(current);
      this.#pageAuthorState.run();
    }
    if (value?.url && value?.urlMediaType && value.urlMediaType !== 'void') {
      const resourceGraph = this.#pageAuthorState.get()?.resourceGraph;
      if (resourceGraph) {
        // Determine the target array based on urlMediaType
        const targetArray = resourceGraph[value.urlMediaType as keyof Pick<ResourceGraph, 'image' | 'video' | 'site'>];
        if (targetArray && Array.isArray(targetArray)) {
          if (value.makeAdd === 'add') {
            // Add URL to the existing collection
            targetArray.push(value.url);
            console.log(`Added to ${value.urlMediaType} collection, total: ${targetArray.length}`);
          } else if (value.makeAdd === 'make') {
            // Replace collection with this URL as the primary item
            targetArray.splice(0, targetArray.length, value.url);
            console.log(`Set ${value.urlMediaType} primary item, total: ${targetArray.length}`);
          }
        }
        this.#pageAuthorState.run();
      }
    }
  }
  get linkResource() {
    return this.#linkResource.get();
  }
  #resourceImage: Signal.State<URL[]> = signal([]);
  set resourceImage(value: URL[]) {
    this.#resourceImage.set(value);
    this.#pageAuthorState.run();
  }

  #pages: Signal.State<Page[]> = signal([]);
  get pages() {
    return this.#pages.get();
  }

  set pages(value: Page[]) {
    this.#pages.set(value);
    this.#pageAuthorState.run();
  }

  #pageAuthor: Signal.State<PageAuthor> = signal({
    uid: 'void',
    resourceGraph: {
      name: '',
      image: [
        new URL(
          'https://firebasestorage.googleapis.com/v0/b/peg-2035.appspot.com/o/uploads%2FnWYqOrwtpbW7VnC5Yay8b4uQbuR2%2FpageAuthor%7Cimage%2F_20180502_132234.jpg?alt=media&token=22bd73dc-2c5f-4b70-a9c4-424413af0c51',
        ),
      ],
      video: [
        new URL(
          'https://firebasestorage.googleapis.com/v0/b/peg-2035.appspot.com/o/uploads%2FnWYqOrwtpbW7VnC5Yay8b4uQbuR2%2FpageAuthor%7Cimage%2F_20180502_132234.jpg?alt=media&token=22bd73dc-2c5f-4b70-a9c4-424413af0c51',
        ),
      ],
      site: [
        new URL(
          'https://firebasestorage.googleapis.com/v0/b/peg-2035.appspot.com/o/uploads%2FnWYqOrwtpbW7VnC5Yay8b4uQbuR2%2FpageAuthor%7Cimage%2F_20180502_132234.jpg?alt=media&token=22bd73dc-2c5f-4b70-a9c4-424413af0c51',
        ),
      ],
      markdown: '',
    },
    pages: [],
  });
  get pageAuthor() {
    return this.#pageAuthor.get();
  }

  #pageAuthorState = new AsyncComputed<PageAuthor | undefined>(async abortSignal => {
    console.log('RUNNING');
    console.log('CURRENTIII\n', JSON.stringify(this.#pageAuthor.get()));
    if (this.uid === undefined || this.uid === 'void') {
      if (userSignal) {
        this.uid = '' + userSignal.get()?.uid;
      } else {
        console.error('UID ON UPDATE IS BROKEN ' + this.#uid.get());
        return undefined;
      }
    }
    if (!abortSignal.aborted && this.#resourceName.get() !== 'void' && this.#resourceName.get() != '') {
      this.#pageAuthor.set({
        ...this.#pageAuthor.get(),
        resourceGraph: {
          ...this.#pageAuthor.get().resourceGraph,
          name: this.#resourceName.get(),
        },
      });
      console.log('PERSISTING NAME\n ' + this.#resourceName.get() + '\n ' + this.uid + '\n ' + Date.now());
      this.#resourceName.set('');
    }
    if (!abortSignal.aborted && this.#markdown.get() != '') {
      this.#pageAuthor.set({
        ...this.#pageAuthor.get(),
        resourceGraph: {
          ...this.#pageAuthor.get().resourceGraph,
          markdown: this.#markdown.get(),
        },
      });
      console.log('PERSISTING MARKDOWN\n ' + this.#markdown.get() + '\n ' + this.uid + '\n ' + Date.now());
      this.#markdown.set('');
    }

    return this.#pageAuthor.get() as PageAuthor;
  });

  get persisted() {
    return this.#pageAuthorState;
  }

  private _updatePageAuthor = (update: Partial<PageAuthor>): void => {
    console.log('CURRENTUUU\n', JSON.stringify(this.#pageAuthor.get()));
    const current = this.#pageAuthor.get();
    this.#pageAuthor.set({
      ...current,
      ...update,
      resourceGraph: {
        ...current.resourceGraph,
        ...update.resourceGraph,
      },
      pages: update.pages || current.pages,
    });
  };
}

export const pageAuthor = new PageAuthorState();

export const renderAsyncComputed = <T>(
  v: AsyncComputed<T>,
  {
    initial,
    pending,
    complete,
    error,
  }: {
    initial?: () => unknown;
    pending?: () => unknown;
    complete?: (value: T) => unknown;
    error?: (error: unknown) => unknown;
  },
) => {
  switch (v.status) {
    case 'initial':
      return initial?.();
    case 'pending':
      return pending?.();
    case 'complete':
      return complete?.(v.value as T);
    case 'error':
      return error?.(v.error as unknown);
  }
};

export const setPageAuthorUid = (uid: string) => {
  pageAuthor.uid = uid;
};
