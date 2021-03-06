'use babel';

import mkdirp from 'mkdirp';
import touch from 'touch';

import AtomPythonPackageView from './atom-python-package-view';
import { CompositeDisposable } from 'atom';

export default {

  atomPythonPackageView: null,
  modalPanel: null,
  subscriptions: null,
  editor: null,

  activate(state) {
    this.atomPythonPackageView = new AtomPythonPackageView(state.atomPythonPackageViewState);
    this.editor = this.atomPythonPackageView.editor;
    this.resetDefaultText();

    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomPythonPackageView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-python-package:toggle': () => this.toggle(),
      'core:confirm': () => this.confirm(),
      'core:cancel': () => this.cancel()
    }));

    this.subscriptions.add(atom.commands.add('.tree-view .directory', {
      'atom-python-package:toggleAtDir': (event) => this.toggleAtDir(event)
    }));
  },

  create() {
    let p = this.atomPythonPackageView.editor.getModel().getText();
    if (!p.endsWith('/')) p += '/';

    mkdirp(p, err => {
      if (err) {
        console.log(err);
      } else {
        touch(`${p}/__init__.py`);
      }
    });
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.atomPythonPackageView.destroy();
  },

  serialize() {
    return {
      atomPythonPackageViewState: this.atomPythonPackageView.serialize()
    };
  },

  confirm() {
    this.create();
    this.cancel();
  },

  cancel() {
    this.resetDefaultText();
    this.modalPanel.hide();
  },

  toggle() {
    if (this.modalPanel.isVisible()) {
      this.modalPanel.hide();
    } else {
      this.modalPanel.show();
      this.editor.focus();
    }
  },

  toggleAtDir(event) {
    event.stopPropagation();
    let path = event.target.dataset.path;

    if (path) this.setDir(path);
    this.toggle();
  },

  setDir(path) {
    if (!path.endsWith('/')) path += '/';
    this.editor.getModel().setText(path);
  },

  resetDefaultText() {
    this.setDir(atom.project.getPaths()[0]);
  }

};
