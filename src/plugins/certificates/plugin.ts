// Certificates plugin for the new architecture
import * as React from 'react';
import type { Plugin } from '../../types/plugin-interface';
import { CertificatesComponent } from './CertificatesComponent';

// Plugin definition
export const certificatesPlugin: Plugin = {
  id: 'certificates',
  name: 'Certificates',
  component: CertificatesComponent,
  icon: '📜',
  order: 7,
};

export default certificatesPlugin;