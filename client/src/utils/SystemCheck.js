class SystemCheck {
  static checkCrossOriginIsolation() {
    return typeof self !== 'undefined' ? self.crossOriginIsolated : false;
  }

  static checkSharedArrayBuffer() {
    return typeof SharedArrayBuffer !== 'undefined';
  }

  static getSystemStatus() {
    return {
      crossOriginIsolated: this.checkCrossOriginIsolation(),
      hasSharedArrayBuffer: this.checkSharedArrayBuffer(),
      isCompatible: this.checkCrossOriginIsolation() && this.checkSharedArrayBuffer()
    };
  }
}

export default SystemCheck;