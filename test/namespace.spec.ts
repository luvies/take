import { expect } from 'chai';
import 'mocha';
import { Environment } from '../src/lib/environment';
import { Namespace } from '../src/lib/namespace';
import { DefaultOptions } from '../src/lib/options';

describe('Namespace', function() {
  let env: Environment;

  beforeEach(function() {
    env = new Environment(DefaultOptions());
  });

  describe('#getRoot', function() {
    it('should return a namespace with no path or arguments', function() {
      const ns = Namespace.getRoot(env);

      expect(ns.names).to.be.eql([]);
      expect(ns.args).to.be.eql([]);
    });
  });

  describe('#parent', function() {
    let root: Namespace;

    beforeEach(function() {
      root = Namespace.getRoot(env);
    });

    it('should return itself if it is the root', function() {
      expect(root.parent).to.be.equal(root);
    })

    it('should return the next namespace up', function() {
      expect(root.resolve('target1').parent.toString()).to.be.equal(root.toString());
      expect(root.resolve('target1:target2').parent.toString())
        .to.be.equal(root.resolve('target1').toString());
      expect(root.resolve('target1:target2:target3').parent.toString())
        .to.be.equal(root.resolve('target1:target2').toString());
      expect(root.resolve('target1:target2:target3:target4').parent.toString())
        .to.be.equal(root.resolve('target1:target2:target3').toString());
    });
  });

  describe('#isRoot', function() {
    let root: Namespace;

    beforeEach(function() {
      root = Namespace.getRoot(env);
    });

    it('should return true for root namespace', function() {
      expect(root.isRoot).to.be.true;
    });

    it('should return false for non-root namespace', function() {
      expect(root.resolve('target1').isRoot).to.be.false;
      expect(root.resolve('target1:target2').isRoot).to.be.false;
      expect(root.resolve('target1:target2:target3').isRoot).to.be.false;
    });
  });

  describe('#names', function() {
    let root: Namespace;

    beforeEach(function() {
      root = Namespace.getRoot(env);
    });

    it('should return an empty list for root', function() {
      expect(root.names).to.be.eql([]);
    });

    it('should return a list of names', function() {
      expect(root.resolve('target1').names).to.be.eql(['target1']);
      expect(root.resolve('target1:target2').names).to.be.eql(['target1', 'target2']);
      expect(root.resolve('target1:target2:target3').names).to.be.eql(['target1', 'target2', 'target3']);
    });
  });

  describe('#resolve', function() {
    let root: Namespace;

    beforeEach(function() {
      root = Namespace.getRoot(env);
    });

    it('should chain', function() {
      expect(root.resolve('target1').resolve('target2').toString())
        .to.be.equal(':target1:target2');
      expect(root.resolve('target1').resolve('target2').resolve('target3').toString())
        .to.be.equal(':target1:target2:target3');
      expect(root.resolve('target1').resolve('target2').resolve('target3').resolve('target4').toString())
        .to.be.equal(':target1:target2:target3:target4');
    })

    it('should resolve to itself if empty string passed in', function() {
      expect(root.resolve('').toString()).to.be.equal(':');
      expect(root.resolve('target1').resolve('').toString()).to.be.equal(':target1');
      expect(root.resolve('target1:target2').resolve('').toString()).to.be.equal(':target1:target2');
      expect(root.resolve('target1:target2:target3').resolve('').toString()).to.be.equal(':target1:target2:target3');
    });

    it('should use given working namespace', function() {
      let ns = root.resolve('ns');
      expect(root.resolve('target1', ns).toString()).to.be.equal(':ns:target1');
      expect(root.resolve('target1:target2', ns).toString()).to.be.equal(':ns:target1:target2');
      expect(root.resolve('target1:target2:target3', ns).toString()).to.be.equal(':ns:target1:target2:target3');
    });

    it('should respect absolute namespaces', function() {
      expect(root.resolve(':target1').toString()).to.be.equal(':target1');
      expect(root.resolve(':target1:target2').toString()).to.be.equal(':target1:target2');
      expect(root.resolve(':target1:target2:target3').toString()).to.be.equal(':target1:target2:target3');

      let ns = root.resolve('ns');
      expect(root.resolve(':target1', ns).toString()).to.be.equal(':target1');
      expect(root.resolve(':target1:target2', ns).toString()).to.be.equal(':target1:target2');
      expect(root.resolve(':target1:target2:target3', ns).toString()).to.be.equal(':target1:target2:target3');
    });

    it('should resolve parent directives', function() {
      expect(root.resolve('target1:^').toString()).to.be.equal(':');
      expect(root.resolve('target1:target2:^').toString()).to.be.equal(':target1');
      expect(root.resolve('target1:^:target2').toString()).to.be.equal(':target2');
      expect(root.resolve('target1:target2:^:^').toString()).to.be.equal(':');
      expect(root.resolve('target1:target2:^:^:target3').toString()).to.be.equal(':target3');
      expect(root.resolve('target1:target2:^:^:target3:^').toString()).to.be.equal(':');
    });

    it('should return the root if a parent directive resolves to above', function() {
      expect(root.resolve('^').toString()).to.be.equal(':');
      expect(root.resolve('^:^').toString()).to.be.equal(':');
      expect(root.resolve('^:^:^').toString()).to.be.equal(':');
      expect(root.resolve('target1:^:^').toString()).to.be.equal(':');
      expect(root.resolve('target1:target2:^:^:^').toString()).to.be.equal(':');
      expect(root.resolve('target1:^:target2:target3:^:^:^').toString()).to.be.equal(':');
    });
  });

  describe('#resolve', function() {
    let env: Environment;
    let root: Namespace;

    beforeEach(function() {
      env = new Environment(DefaultOptions());
      root = Namespace.getRoot(env);
    });

    it('should respect alternate namespace separators', function() {
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

    it('should respect alternate parent directives', function() {
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
  });

  describe('#format', function() {
    let env: Environment;
    let root: Namespace;

    beforeEach(function() {
      env = new Environment(DefaultOptions());
      root = Namespace.getRoot(env);
    });

    it('should leave namespaces with no tags in unchanged', function() {
      expect(root.resolve('').format(['a', 'b']).toString())
        .to.be.equal(':');
      expect(root.resolve('target1').format(['a', 'b']).toString())
        .to.be.equal(':target1');
      expect(root.resolve('target1:target2').format(['a', 'b']).toString())
        .to.be.equal(':target1:target2');
      expect(root.resolve('target1:target2:target3').format(['a', 'b']).toString())
        .to.be.equal(':target1:target2:target3');
    });

    it('should format the tags in correctly', function() {
      expect(root.resolve('target$0').format(['a', 'b']).toString())
        .to.be.equal(':targeta');
      expect(root.resolve('target$0:target$1').format(['a', 'b']).toString())
        .to.be.equal(':targeta:targetb');
      expect(root.resolve('target$1:target$3:target$2').format(['a', 'b', 'c', 'd']).toString())
        .to.be.equal(':targetb:targetd:targetc');
      expect(root.resolve('$1target$1:$2target$1:target$2').format(['a', 'b', 'c', 'd']).toString())
        .to.be.equal(':btargetb:ctargetb:targetc');
    });

    it('should leave tags unchanged if there isn\'t a matching list item', function() {
      expect(root.resolve('target$0').format([]).toString())
        .to.be.equal(':target$0');
      expect(root.resolve('target$1').format(['a']).toString())
        .to.be.equal(':target$1');
      expect(root.resolve('target$2').format(['a', 'b']).toString())
        .to.be.equal(':target$2');
      expect(root.resolve('target$5:target$2').format(['a', 'b']).toString())
        .to.be.equal(':target$5:target$2');
      expect(root.resolve('target$3:target$4:target$5').format(['a', 'b', 'c']).toString())
        .to.be.equal(':target$3:target$4:target$5');
    });
  });

  describe('#equalTo', function() {
    let root: Namespace;

    beforeEach(function() {
      root = Namespace.getRoot(env);
    });

    it('should return true for equal namespaces', function() {
      expect(root.equalTo(root)).to.be.true;
      expect(root.resolve('target1').equalTo(root.resolve('target1'))).to.be.true;
      expect(root.resolve('target1:target2').equalTo(root.resolve('target1:target2'))).to.be.true;
      expect(root.resolve('target1:target2:target3').equalTo(root.resolve('target1:target2:target3'))).to.be.true;
    });
  });

  describe('#toString', function() {
    let root: Namespace;

    beforeEach(function() {
      root = Namespace.getRoot(env);
    });

    it('should return a full qualified namespace string', function() {
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

    it('should return a full qualified namespace string with arguments', function() {
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
