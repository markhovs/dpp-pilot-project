from basyx.aas.model.backend import Backend, register_backend


class ExternalDataBackend(Backend):
    @classmethod
    def update_object(cls, updated_object, store_object, relative_path):
        """
        Update the local updated_object with data from the external source.
        For example, if store_object.source is an external URI,
        you can use HTTP requests (or another client) to fetch the latest data.
        Then, update the updated_object's properties accordingly.
        """
        # Example pseudocode:
        # external_url = store_object.source + "/" + "/".join(relative_path)
        # response = requests.get(external_url)
        # if response.ok:
        #     new_data = response.json()
        #     # Update updated_object's properties from new_data.
        #     updated_object.update_from_external(new_data)
        # else:
        #     raise BackendNotAvailableException("External source not available")
        pass

    @classmethod
    def commit_object(cls, committed_object, store_object, relative_path):
        """
        Commit local changes from committed_object back to the external data source.
        """
        # Example pseudocode:
        # external_url = store_object.source + "/" + "/".join(relative_path)
        # data_to_commit = committed_object.to_external_format()
        # response = requests.post(external_url, json=data_to_commit)
        # if not response.ok:
        #     raise BackendNotAvailableException("Failed to commit data")
        pass


# Register the backend for a custom URI scheme, e.g. "external"
register_backend("external", ExternalDataBackend)
