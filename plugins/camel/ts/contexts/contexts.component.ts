/// <reference path="context.ts"/>
/// <reference path="contexts.service.ts"/>

namespace Camel {

  export class ContextsController {

    private startAction = {
      name: 'Start',
      actionFn: action => {
        let selectedContexts = this.getSelectedContexts();
        this.contextsService.startContexts(selectedContexts)
          .then(response => this.updateContexts());
      },
      isDisabled: true
    };
    private suspendAction = {
      name: 'Suspend',
      actionFn: action => {
        let selectedContexts = this.getSelectedContexts();
        this.contextsService.suspendContexts(selectedContexts)
          .then(response => this.updateContexts());
      },
      isDisabled: true
    }
    private deleteAction = {
      name: 'Delete',
      actionFn: action => {
        this.$uibModal.open({
          templateUrl: 'deleteContextModal.html'
        })
        .result.then(() => {
          let selectedContexts = this.getSelectedContexts();
          this.contextsService.stopContexts(selectedContexts)
            .then(response => this.removeSelectedContexts());
        });
      },
      isDisabled: true
    };

    toolbarConfig = {
      actionsConfig: {
        primaryActions: [
          this.startAction,
          this.suspendAction
        ],
        moreActions: [
          this.deleteAction
        ]
      }
    };

    tableConfig = {
      selectionMatchProp: "name",
      onCheckBoxChange: item => this.enableDisableActions()
    };

    tableColummns = [
      { header: "Name", itemField: "name" },
      { header: "State", itemField: "state" }
    ];

    tableItems = [{ name: null, state: null }];
    
    contexts: Context[];

    constructor(private $uibModal, private workspace: Jmx.Workspace, private contextsService: ContextsService) {
      'ngInject';
    }

    $onInit() {
      this.loadContexts();
    }

    private getSelectedContexts() {
      return this.tableItems
        .map((tableItem, i) => angular.extend(this.contexts[i], { selected: tableItem['selected'] }))
        .filter(context => context.selected);
    }

    private enableDisableActions() {
      let selectedContexts = this.getSelectedContexts();
      this.startAction.isDisabled = !selectedContexts.some((route: Route) => route.state === 'Suspended');
      this.suspendAction.isDisabled = !selectedContexts.some((route: Route) => route.state === 'Started');
      this.deleteAction.isDisabled = selectedContexts.length === 0;
    }

    private loadContexts() {
      if (this.workspace.selection) {
        var typeNames = Jmx.getUniqueTypeNames(this.workspace.selection.children);
        if (typeNames.length > 1) {
          console.error("Child nodes aren't of the same type. Found types: " + typeNames);
        }
        let mbeans = this.workspace.selection.children.map(node => node.objectName);
        this.contextsService.getContexts(mbeans)
          .then(contexts => {
            this.tableItems = contexts.map(context => ({
              name: context.name,
              state: context.state
            }));
            this.contexts = contexts;
          });
      }
    }

    private updateContexts() {
      let mbeans = this.contexts.map(context => context.mbean);
      this.contextsService.getContexts(mbeans)
        .then(contexts => {
          this.contexts = contexts;
          contexts.forEach((context, i) => this.tableItems[i].state = context.state);
          this.enableDisableActions();
        });
    }

    private removeSelectedContexts() {
      this.tableItems.forEach((tableItem, i) => angular.extend(this.contexts[i], { selected: tableItem['selected'] }));
      _.remove(this.contexts, context => context.selected);
      _.remove(this.tableItems, tableItem => tableItem['selected']);
      this.workspace.loadTree();
      this.enableDisableActions();
    }

  }

  export const contextsComponent = {
    templateUrl: 'plugins/camel/html/contexts.html',
    controller: ContextsController
  };

}
