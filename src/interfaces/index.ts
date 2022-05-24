declare namespace Loader {
  type Model = {
    name: string;
    model: any;
  };
  export type models = {
    models: Array<Model>;
  };
}
export { Loader };
