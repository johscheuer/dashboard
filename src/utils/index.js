/*
Copyright 2019 The Tekton Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import snakeCase from 'lodash.snakecase';
import CheckmarkFilled from '@carbon/icons-react/lib/checkmark--filled/16';
import CloseFilled from '@carbon/icons-react/lib/close--filled/16';

import Spinner from '../components/Spinner';

export function getErrorMessage(error) {
  if (!error || typeof error === 'string') {
    return error;
  }

  return JSON.stringify(error, Object.getOwnPropertyNames(error));
}

export function getStatus(resource) {
  const { conditions = [] } = resource.status || {};
  return conditions.find(condition => condition.type === 'Succeeded') || {};
}

export function isRunning(reason, status) {
  return (
    status === 'Unknown' && (reason === 'Running' || reason === 'Building')
  );
}

export function getStatusIcon({ reason, status }) {
  if (isRunning(reason, status)) {
    return <Spinner className="status-icon" />;
  }

  let Icon;
  if (status === 'True') {
    Icon = CheckmarkFilled;
  } else if (status === 'False') {
    Icon = CloseFilled;
  }

  return Icon ? <Icon className="status-icon" /> : null;
}

export function taskRunStep(selectedStepId, taskRun) {
  if (!taskRun || !taskRun.steps) {
    return {};
  }
  const step = taskRun.steps.find(s => s.id === selectedStepId);
  if (!step) {
    return {};
  }

  const { stepName, stepStatus, status, reason, ...definition } = step;

  return {
    definition,
    reason,
    stepName,
    stepStatus,
    status
  };
}

export function selectedTask(selectedTaskName, tasks) {
  return tasks.find(t => t.metadata.name === selectedTaskName);
}

export function selectedTaskRun(selectedTaskId, taskRuns = []) {
  return taskRuns.find(run => run.id === selectedTaskId);
}

export function stepsStatus(taskSteps, taskRunStepsStatus = []) {
  const steps = taskSteps.map(step => {
    const stepStatus =
      taskRunStepsStatus.find(status => status.name === step.name) || {};

    let status;
    let reason;
    if (stepStatus.terminated) {
      status = 'terminated';
      ({ reason } = stepStatus.terminated);
    } else if (stepStatus.running) {
      status = 'running';
    } else if (stepStatus.waiting) {
      status = 'waiting';
    }

    return {
      ...step,
      reason,
      status,
      stepStatus,
      stepName: step.name,
      id: step.name
    };
  });

  /*
    In case of failure in an init step (git-source, init-creds, etc.),
    include that step in the displayed list so we can surface status
    and logs to aid the user in debugging.
   */
  taskRunStepsStatus.forEach(stepStatus => {
    const { name: stepName, terminated } = stepStatus;
    const step = taskSteps.find(taskStep => taskStep.name === stepName);
    if (!step && terminated && terminated.exitCode !== 0) {
      steps.push({
        reason: terminated.reason,
        status: 'terminated',
        stepStatus,
        stepName,
        id: stepName
      });
    }
  });

  return steps;
}

export function typeToPlural(type) {
  return `${snakeCase(type).toUpperCase()}S`;
}
