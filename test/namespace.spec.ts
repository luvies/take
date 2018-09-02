import { expect } from 'chai';
import 'mocha';
import { Environment } from '../src/lib/environment';
import { Namespace } from '../src/lib/namespace';
import { DefaultOptions } from '../src/lib/options';

describe('Namespace', function(this) {
  let env: Environment;

  beforeEach(function(this) {
    env = new Environment(DefaultOptions());
  });

  describe('#getRoot', function(this) {
    it('should return a namespace with no path or arguments', function(this) {
      const ns = Namespace.getRoot(env);

      expect(ns.names).to.be.eql([]);
      expect(ns.args).to.be.eql([]);
    });
  });

  describe('#parent', function(this) {
    let root: Namespace;

    beforeEach(function(this) {
      root = Namespace.getRoot(env);
    });

    it('should return itself if it is the root', function(this) {
      expect(root.parent).to.be.equal(root);
    })

    it('should return the next namespace up', function(this) {
      expect(root.resolve('target1').parent.toString()).to.be.equal(root.toString());
      expect(root.resolve('target1:target2').parent.toString())
        .to.be.equal(root.resolve('target1').toString());
      expect(root.resolve('target1:target2:target3').parent.toString())
        .to.be.equal(root.resolve('target1:target2').toString());
      expect(root.resolve('target1:target2:target3:target4').parent.toString())
        .to.be.equal(root.resolve('target1:target2:target3').toString());
    });
  });

  describe('#isRoot', function(this) {
    let root: Namespace;

    beforeEach(function(this) {
      root = Namespace.getRoot(env);
    });

    it('should return true for root namespace', function(this) {
      expect(root.isRoot).to.be.true;
    });

    it('should return false for non-root namespace', function(this) {
      expect(root.resolve('target1').isRoot).to.be.false;
      expect(root.resolve('target1:target2').isRoot).to.be.false;
      expect(root.resolve('target1:target2:target3').isRoot).to.be.false;
    });
  });

  describe('#names', function(this) {
    let root: Namespace;

    beforeEach(function(this) {
      root = Namespace.getRoot(env);
    });

    it('should return an empty list for root', function(this) {
      expect(root.names).to.be.eql([]);
    });

    it('should return a list of names', function(this) {
      expect(root.resolve('target1').names).to.be.eql(['target1']);
      expect(root.resolve('target1:target2').names).to.be.eql(['target1', 'target2']);
      expect(root.resolve('target1:target2:target3').names).to.be.eql(['target1', 'target2', 'target3']);
    });
  });

  describe('#resolve', function(this) {
    let root: Namespace;

    beforeEach(function(this) {
      root = Namespace.getRoot(env);
    });

    it('should chain', function(this) {
      expect(root.resolve('target1').resolve('target2').toString())
        .to.be.equal(':target1:target2');
      expect(root.resolve('target1').resolve('target2').resolve('target3').toString())
        .to.be.equal(':target1:target2:target3');
      expect(root.resolve('target1').resolve('target2').resolve('target3').resolve('target4').toString())
        .to.be.equal(':target1:target2:target3:target4');
    })

    it('should resolve to itself if empty string passed in', function(this) {
      expect(root.resolve('').toString()).to.be.equal(':');
      expect(root.resolve('target1').resolve('').toString()).to.be.equal(':target1');
      expect(root.resolve('target1:target2').resolve('').toString()).to.be.equal(':target1:target2');
      expect(root.resolve('target1:target2:target3').resolve('').toString()).to.be.equal(':target1:target2:target3');
    });

    it('should use given working namespace', function(this) {
      let ns = root.resolve('ns');
      expect(root.resolve('target1', ns).toString()).to.be.equal(':ns:target1');
      expect(root.resolve('target1:target2', ns).toString()).to.be.equal(':ns:target1:target2');
      expect(root.resolve('target1:target2:target3', ns).toString()).to.be.equal(':ns:target1:target2:target3');
    });

    it('should respect absolute namespaces', function(this) {
      expect(root.resolve(':target1').toString()).to.be.equal(':target1');
      expect(root.resolve(':target1:target2').toString()).to.be.equal(':target1:target2');
      expect(root.resolve(':target1:target2:target3').toString()).to.be.equal(':target1:target2:target3');

      let ns = root.resolve('ns');
      expect(root.resolve(':target1', ns).toString()).to.be.equal(':target1');
      expect(root.resolve(':target1:target2', ns).toString()).to.be.equal(':target1:target2');
      expect(root.resolve(':target1:target2:target3', ns).toString()).to.be.equal(':target1:target2:target3');
    });

    it('should resolve parent directives', function(this) {
      expect(root.resolve('target1:^').toString()).to.be.equal(':');
      expect(root.resolve('target1:target2:^').toString()).to.be.equal(':target1');
      expect(root.resolve('target1:^:target2').toString()).to.be.equal(':target2');
      expect(root.resolve('target1:target2:^:^').toString()).to.be.equal(':');
      expect(root.resolve('target1:target2:^:^:target3').toString()).to.be.equal(':target3');
      expect(root.resolve('target1:target2:^:^:target3:^').toString()).to.be.equal(':');
    });

    it('should return the root if a parent directive resolves to above', function(this) {
      expect(root.resolve('^').toString()).to.be.equal(':');
      expect(root.resolve('^:^').toString()).to.be.equal(':');
      expect(root.resolve('^:^:^').toString()).to.be.equal(':');
      expect(root.resolve('target1:^:^').toString()).to.be.equal(':');
      expect(root.resolve('target1:target2:^:^:^').toString()).to.be.equal(':');
      expect(root.resolve('target1:^:target2:target3:^:^:^').toString()).to.be.equal(':');
    });
  });

  describe('#resolve', function(this) {
    let env: Environment;
    let root: Namespace;

    beforeEach(function(this) {
      env = new Environment(DefaultOptions());
      root = Namespace.getRoot(env);
    });

    it('should respect alternate namespace separators', function(this) {
      env.options.namespaceSeparator = '/';
      expect(root.resolve('target1').resolve('target2').toString())
        .to.be.equal('/target1/target2');
      expect(root.resolve('target1').resolve('target2').resolve('target3').toString())
        .to.be.equal('/target1/target2/target3');
      expect(root.resolve('target1').resolve('target2').resolve('target3').resolve('target4').toString())
        .to.be.equal('/target1/target2/target3/target4');
      expect(root.resolve('target1').toString()).to.be.equal('/target1');
      expect(root.resolve('target1/target2').toString()).to.be.equal('/target1/target2');
      expect(root.resolve('target1/target2/target3').toString()).to.be.equal('/target1/target2/target3');
      expect(root.resolve('target1/target2:target3').toString()).to.be.equal('/target1/target2:target3');

      env.options.namespaceSeparator = '-';
      expect(root.resolve('target1').resolve('target2').toString())
        .to.be.equal('-target1-target2');
      expect(root.resolve('target1').resolve('target2').resolve('target3').toString())
        .to.be.equal('-target1-target2-target3');
      expect(root.resolve('target1').resolve('target2').resolve('target3').resolve('target4').toString())
        .to.be.equal('-target1-target2-target3-target4');
      expect(root.resolve('target1').toString()).to.be.equal('-target1');
      expect(root.resolve('target1-target2').toString()).to.be.equal('-target1-target2');
      expect(root.resolve('target1-target2-target3').toString()).to.be.equal('-target1-target2-target3');
      expect(root.resolve('target1-target2:target3').toString()).to.be.equal('-target1-target2:target3');
    });

    it('should respect alternate parent directives', function(this) {
      env.options.namespaceParent = '..';
      expect(root.resolve('target1:..').toString()).to.be.equal(':');
      expect(root.resolve('target1:target2:..').toString()).to.be.equal(':target1');
      expect(root.resolve('target1:..:target2').toString()).to.be.equal(':target2');
      expect(root.resolve('target1:target2:..:..').toString()).to.be.equal(':');
      expect(root.resolve('target1:target2:..:..:target3').toString()).to.be.equal(':target3');
      expect(root.resolve('target1:target2:..:..:target3:..').toString()).to.be.equal(':');

      env.options.namespaceParent = '|';
      expect(root.resolve('target1:|').toString()).to.be.equal(':');
      expect(root.resolve('target1:target2:|').toString()).to.be.equal(':target1');
      expect(root.resolve('target1:|:target2').toString()).to.be.equal(':target2');
      expect(root.resolve('target1:target2:|:|').toString()).to.be.equal(':');
      expect(root.resolve('target1:target2:|:|:target3').toString()).to.be.equal(':target3');
      expect(root.resolve('target1:target2:|:|:target3:|').toString()).to.be.equal(':');
    });
  })

  describe('#equalTo', function(this) {
    let root: Namespace;

    beforeEach(function(this) {
      root = Namespace.getRoot(env);
    });

    it('should return true for equal namespaces', function(this) {
      expect(root.equalTo(root)).to.be.true;
      expect(root.resolve('target1').equalTo(root.resolve('target1'))).to.be.true;
      expect(root.resolve('target1:target2').equalTo(root.resolve('target1:target2'))).to.be.true;
      expect(root.resolve('target1:target2:target3').equalTo(root.resolve('target1:target2:target3'))).to.be.true;
    });
  });

  describe('#toString', function(this) {
    let root: Namespace;

    beforeEach(function(this) {
      root = Namespace.getRoot(env);
    });

    it('should return a full qualified namespace string', function(this) {
      expect(root.toString()).to.be.equal(':');
      expect(root.resolve('target1').toString()).to.be.equal(':target1');
      expect(root.resolve('target2').toString()).to.be.equal(':target2');
      expect(root.resolve('target3').toString()).to.be.equal(':target3');
      expect(root.resolve('target1:target2').toString()).to.be.equal(':target1:target2');
      expect(root.resolve('target2:target3').toString()).to.be.equal(':target2:target3');
      expect(root.resolve('target3:target4').toString()).to.be.equal(':target3:target4');
      expect(root.resolve('target1:target2:target3').toString()).to.be.equal(':target1:target2:target3');
      expect(root.resolve('target2:target3:target4').toString()).to.be.equal(':target2:target3:target4');
      expect(root.resolve('target3:target4:target5').toString()).to.be.equal(':target3:target4:target5');
    });

    it('should return a full qualified namespace string with arguments', function(this) {
      expect(root.resolve('target1').toString(true)).to.be.equal(':target1');
      expect(root.resolve('target2[]').toString(true)).to.be.equal(':target2[]');
      expect(root.resolve('target3[a]').toString(true)).to.be.equal(':target3[a]');
      expect(root.resolve('target1[a,b]').toString(true)).to.be.equal(':target1[a,b]');
      expect(root.resolve('target2[a,b,c]').toString(true)).to.be.equal(':target2[a,b,c]');
      expect(root.resolve('target3[a,b, c]').toString(true)).to.be.equal(':target3[a,b, c]');
      expect(root.resolve('target1:target2').toString(true)).to.be.equal(':target1:target2');
      expect(root.resolve('target2:target3[]').toString(true)).to.be.equal(':target2:target3[]');
      expect(root.resolve('target3:target4[a]').toString(true)).to.be.equal(':target3:target4[a]');
      expect(root.resolve('target1:target2[a,b]').toString(true)).to.be.equal(':target1:target2[a,b]');
      expect(root.resolve('target2:target3[a,b,c]').toString(true)).to.be.equal(':target2:target3[a,b,c]');
      expect(root.resolve('target3:target4[a,b, c]').toString(true)).to.be.equal(':target3:target4[a,b, c]');
    });
  });
});
