import { ServiceProvider } from '@app/Foundation/ServiceProvider';
import { Logger } from '@app/Support/Logger';
import { ResultCountReader } from './ResultCountReader';
import { ResultsRefresher } from './ResultsRefresher';

export class ResultsServiceProvider extends ServiceProvider {
  register(): void {
    this.app.singleton(ResultsRefresher, (app) => new ResultsRefresher(document, app.make(Logger)));
    this.app.singleton(ResultCountReader, () => new ResultCountReader(document));
  }
}
