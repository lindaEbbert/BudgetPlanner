import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonHarness } from '@angular/material/button/testing';
import { FixedCostFormComponent } from './fixed-costs-form.component';

function setup() {
  TestBed.configureTestingModule({
    imports: [FixedCostFormComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MatDialogRef, useValue: { close: () => {} } },
    ],
  });

  const fixture = TestBed.createComponent(FixedCostFormComponent);
  const httpMock = TestBed.inject(HttpTestingController);
  const loader = TestbedHarnessEnvironment.loader(fixture);
  return { fixture, component: fixture.componentInstance, httpMock, loader };
}

describe('FixedCostFormComponent – start date', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.unstubAllEnvs();
  });

  it('saves the day picked in the date picker east of UTC', async () => {
    vi.stubEnv('TZ', 'Europe/Berlin');
    const { component, httpMock, loader } = setup();
    component.form.patchValue({ name: 'Miete', amount: 850 });
    // The date picker hands over the picked day at local midnight.
    component.form.controls.startDate.setValue(new Date(2026, 9, 1));

    await (await loader.getHarness(MatButtonHarness.with({ text: 'Speichern' }))).click();

    const request = httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('/fixed-costs'));
    expect(request.request.body.startDate).toBe('2026-10-01');
  });
});
