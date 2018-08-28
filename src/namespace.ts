import { IOptions } from './options';

/**
 * Provides helpers methods for dealing with namespaces.
 */
export class Namespace {
  public constructor(
    private options: IOptions
  ) { }

  /**
   * Converts a list of namespace names into a single string.
   */
  public join(...items: string[]): string {
    if (items.length > 0) {
      const nss = this.options.namespaceSeparator; // shortcut
      // if the first item is in the form ':ns' then make sure the namespace
      // separator isn't removed
      return (items[0].startsWith(nss) ? nss : '') +
        // remove the namespace separator from start and ends so join doesn't double up
        items.map(item => {
          if (item.startsWith(nss)) {
            item = item.slice(1);
          }
          if (item.endsWith(nss)) {
            item = item.slice(0, item.length - 1);
          }
          return item;
        }).join(nss);
    } else {
      return '';
    }
  }

  /**
   * Converts a namespace string into a list of namespaces.
   */
  public split(full: string): string[] {
    // split full string into each namespace name
    const spl: string[] = full.split(this.options.namespaceSeparator);
    // trailing separators are treated as refering to the last namespace anyway
    // so we need to remove the empty item if it exists
    if (spl.length > 0 && !spl[spl.length - 1]) {
      spl.pop();
    }
    return spl;
  }

  /**
   * Extracts the full namespace and arguments from a target string.
   * If the extraction failed, then it will return undefined.
   *
   * @param target The full target string to extract from.
   * @returns The tuple of namespace and argument list, or undefined if parse failed.
   */
  public extractArgs(target: string): [string, string[]] | undefined {
    const match = target.match(/^([^[\]]*)(?:\[([^[\]]*)\])?$/);
    if (match) {
      return [match[1], match[2] ? match[2].split(',') : []];
    } else {
      console.error(`${target} is not a valid target`);
    }
  }
}
