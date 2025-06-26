// Assessment plugin for the new architecture
import * as React from 'react';
import type { Plugin } from '../../types/plugin-interface';
import { AssessmentComponent } from './AssessmentComponent';

// Plugin definition
export const assessmentPlugin: Plugin = {
  id: 'assessment',
  name: 'Assessment',
  component: AssessmentComponent,
  icon: '📝',
  order: 11,
};

export default assessmentPlugin;