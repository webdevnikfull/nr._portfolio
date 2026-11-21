/* Deterministic rules for the local training workspace. */
window.NRSecurityDomain = (() => {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const devices = [
    { id: 'NR-LT-001', name: 'ThinkPad T14', platform: 'Windows 11', owner: 'u1', managed: true, encrypted: true, protected: true, patchDays: 4 },
    { id: 'NR-PC-002', name: 'Dell OptiPlex', platform: 'Windows 11', owner: 'u2', managed: true, encrypted: false, protected: true, patchDays: 42 },
    { id: 'NR-MB-003', name: 'iPhone 15', platform: 'iOS', owner: 'u1', managed: false, encrypted: true, protected: true, patchDays: 12 },
    { id: 'NR-MB-004', name: 'Pixel 8', platform: 'Android', owner: 'u3', managed: true, encrypted: true, protected: false, patchDays: 36 },
  ];
  const users = [
    { id: 'u1', name: 'Alex Morgan', role: 'standardRole', mfa: true, enabled: true, risk: 'low' },
    { id: 'u2', name: 'Maya Chen', role: 'adminRole', mfa: false, enabled: true, risk: 'medium' },
    { id: 'u3', name: 'Jordan Reed', role: 'guestRole', mfa: true, enabled: true, risk: 'high' },
  ];
  const baseline = { maxPatchDays: 30, requireMfa: true, requireCompliant: true, blockHighRisk: true };

  function assessDevice(device, policy) {
    const reasons = [];
    if (!device.managed) reasons.push('reasonManaged');
    if (!device.encrypted) reasons.push('reasonEncryption');
    if (!device.protected) reasons.push('reasonProtection');
    if (device.patchDays > policy.maxPatchDays) reasons.push('reasonUpdates');
    return { compliant: reasons.length === 0, reasons, passed: 4 - reasons.length, total: 4 };
  }

  function evaluateAccess(user, device, policy, network) {
    const reasons = [];
    if (!user.enabled) reasons.push('reasonDisabled');
    if (policy.blockHighRisk && user.risk === 'high') reasons.push('reasonRisk');
    if (policy.requireCompliant && !assessDevice(device, policy).compliant) reasons.push('reasonDevice');
    if (reasons.length) return { decision: 'blocked', reasons };
    if (!user.mfa && (policy.requireMfa || network === 'untrusted')) {
      return { decision: 'challenge', reasons: [network === 'untrusted' ? 'reasonUntrusted' : 'reasonMfa'] };
    }
    return { decision: 'allowed', reasons: ['reasonAllowed'] };
  }

  function seed() {
    return { version: 2, devices: clone(devices), users: clone(users), policy: clone(baseline), done: [], notes: '', audit: [] };
  }

  function restore(saved, legacy) {
    const state = seed();
    if (saved?.version === 2) {
      for (const device of state.devices) {
        const item = Array.isArray(saved.devices) ? saved.devices.find(entry => entry?.id === device.id) : null;
        for (const key of ['managed', 'encrypted', 'protected']) {
          if (typeof item?.[key] === 'boolean') device[key] = item[key];
        }
        if (Number.isInteger(item?.patchDays) && item.patchDays >= 0 && item.patchDays <= 3650) device.patchDays = item.patchDays;
      }
      for (const user of state.users) {
        const item = Array.isArray(saved.users) ? saved.users.find(entry => entry?.id === user.id) : null;
        for (const key of ['mfa', 'enabled']) if (typeof item?.[key] === 'boolean') user[key] = item[key];
        if (['low', 'medium', 'high'].includes(item?.risk)) user.risk = item.risk;
      }
      for (const key of ['requireMfa', 'requireCompliant', 'blockHighRisk']) {
        if (typeof saved.policy?.[key] === 'boolean') state.policy[key] = saved.policy[key];
      }
      if (Number.isInteger(saved.policy?.maxPatchDays) && saved.policy.maxPatchDays >= 1 && saved.policy.maxPatchDays <= 90) state.policy.maxPatchDays = saved.policy.maxPatchDays;
      state.notes = typeof saved.notes === 'string' ? saved.notes.slice(0, 2000) : '';
      if (Array.isArray(saved.audit)) state.audit = saved.audit.filter(event => event && typeof event.time === 'string' && typeof event.action === 'string' && Number.isFinite(Date.parse(event.time))).slice(0, 100).map(event => ({ time: event.time, action: event.action.slice(0, 60), target: String(event.target || '').slice(0, 100), outcome: ['allowed', 'blocked', 'challenge', 'compliant', 'attention', 'recorded'].includes(event.outcome) ? event.outcome : 'recorded' }));
    }
    const done = saved?.version === 2 ? saved.done : legacy?.done;
    if (Array.isArray(done)) state.done = [...new Set(done.filter(value => Number.isInteger(value) && value >= 0 && value < 6))];
    return state;
  }
  return { seed, restore, assessDevice, evaluateAccess };
})();
