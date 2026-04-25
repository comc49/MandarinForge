import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToaster } from '@spartan-ng/helm/sonner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmToaster],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
